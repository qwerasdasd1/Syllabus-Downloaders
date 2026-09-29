"use strict";

(() => {
  // Exclude the course-table API and syllabus detail pages covered by the match pattern.
  if (!/^\/student\/for-std\/course-table\/?$/.test(location.pathname)) return;
  if (document.getElementById("westlake-course-catalog")) return;

  const root = document.createElement("details");
  root.id = "westlake-course-catalog";
  root.innerHTML = `
    <summary>查询未选课程的大纲<span class="wsd-catalog-expand" aria-hidden="true">展开</span><span class="wsd-catalog-collapse" aria-hidden="true">收起</span></summary>
    <div class="wsd-catalog-body">
      <form class="wsd-catalog-source">
        <label>学期 <select name="catalog" aria-label="课程目录学期"></select></label>
        <button type="submit">加载课程目录</button>
      </form>
      <div id="wsd-catalog-content" hidden>
        <label class="wsd-catalog-search">查找课程
          <input name="query" type="search" placeholder="课程名称、代码或教师姓名" disabled>
        </label>
        <p class="wsd-catalog-status" role="status" aria-live="polite"></p>
        <div class="wsd-catalog-results"></div>
      </div>
    </div>`;
  document.body.prepend(root);

  const api = WestlakeSyllabusCatalog;
  const form = root.querySelector("form");
  const catalogSelect = root.querySelector('[name="catalog"]');
  for (const { id, label } of api.listCatalogs()) {
    const option = cell("option", label);
    option.value = id;
    catalogSelect.append(option);
  }
  const queryInput = root.querySelector('[name="query"]');
  const submit = form.querySelector('[type="submit"]');
  const content = root.querySelector("#wsd-catalog-content");
  const status = root.querySelector('[role="status"]');
  const results = root.querySelector(".wsd-catalog-results");
  const PAGE_SIZE = 40;
  let lessons = [];
  let currentPage = 1;
  let controller;
  let syllabusController;
  const pagers = [createPager("课程列表顶部分页"), createPager("课程列表底部分页")];
  results.before(pagers[0].nav);
  results.after(pagers[1].nav);

  function cell(tag, text) {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
  }

  function createPager(label) {
    const nav = document.createElement("nav");
    nav.className = "wsd-catalog-pagination";
    nav.setAttribute("aria-label", label);
    nav.hidden = true;
    const previous = cell("button", "上一页");
    const next = cell("button", "下一页");
    previous.type = next.type = "button";
    const pageLabel = cell("label", "页码 ");
    const select = document.createElement("select");
    pageLabel.append(select);
    nav.append(previous, pageLabel, next);
    function changePage(page) {
      currentPage = page;
      render();
      if (nav === pagers[1].nav) {
        content.scrollIntoView({ block: "start" });
        pagers[0].select.focus({ preventScroll: true });
      }
    }
    previous.addEventListener("click", () => changePage(currentPage - 1));
    next.addEventListener("click", () => changePage(currentPage + 1));
    select.addEventListener("change", () => changePage(Number(select.value)));
    return { nav, previous, next, select };
  }

  function updatePagers(totalPages, totalLessons) {
    for (const { nav, previous, next, select } of pagers) {
      nav.hidden = totalLessons <= PAGE_SIZE;
      previous.disabled = currentPage === 1;
      next.disabled = currentPage === totalPages;
      if (select.options.length !== totalPages) {
        select.replaceChildren();
        for (let page = 1; page <= totalPages; page++) {
          const option = cell("option", `第 ${page} / ${totalPages} 页`);
          option.value = String(page);
          select.append(option);
        }
      }
      select.value = String(currentPage);
    }
  }

  catalogSelect.addEventListener("change", () => {
    controller?.abort();
    syllabusController?.abort();
    lessons = [];
    currentPage = 1;
    updatePagers(1, 0);
    results.replaceChildren();
    queryInput.value = "";
    queryInput.disabled = true;
    status.textContent = "";
    submit.disabled = false;
    content.hidden = true;
  });

  function render() {
    syllabusController?.abort();
    results.replaceChildren();
    const matches = api.filterLessons(lessons, queryInput.value);
    const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
    const start = (currentPage - 1) * PAGE_SIZE;
    updatePagers(totalPages, matches.length);
    status.textContent = matches.length
      ? `找到 ${matches.length} 个教学班，显示第 ${start + 1}–${Math.min(start + PAGE_SIZE, matches.length)} 个。`
      : "找到 0 个教学班。";
    if (!matches.length) return;

    const table = document.createElement("table");
    const header = document.createElement("tr");
    for (const label of ["课程", "教学班 / 任课教师", "教学大纲"]) {
      const heading = cell("th", label);
      heading.scope = "col";
      header.append(heading);
    }
    const head = document.createElement("thead");
    head.append(header);
    const body = document.createElement("tbody");
    for (const lesson of matches.slice(start, start + PAGE_SIZE)) {
      const row = document.createElement("tr");
      row.append(cell("td", `${lesson.courseName.replaceAll("|", " / ")}\n${lesson.courseCode}`));
      row.append(cell("td", `${lesson.lessonCode || ""}\n${(lesson.teacherName || "未列出任课教师").replaceAll("|", " / ")}`));
      const action = document.createElement("td");
      const button = cell("button", "查询大纲");
      button.type = "button";
      button.setAttribute("aria-label", `查询 ${lesson.courseCode} ${lesson.lessonCode || ""} 的大纲`);
      const outcome = document.createElement("div");
      outcome.setAttribute("role", "status");
      button.addEventListener("click", async () => {
        // Read only one selected course at a time; never batch-fetch syllabus files.
        syllabusController?.abort();
        const request = new AbortController();
        syllabusController = request;
        button.disabled = true;
        outcome.replaceChildren(cell("span", "正在读取大纲资料…"));
        try {
          const links = await api.loadSyllabus(lesson.id, request.signal);
          if (request.signal.aborted) return;
          outcome.replaceChildren();
          for (const { label, url } of links) {
            const link = cell("a", label);
            link.href = url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            outcome.append(link);
          }
          if (!links.length) outcome.textContent = "未找到可用的大纲附件或在线大纲。";
        } catch (error) {
          if (!request.signal.aborted) outcome.textContent = error.message;
        } finally {
          if (request.signal.aborted) outcome.textContent = "查询已取消，可重试。";
          button.disabled = false;
        }
      });
      action.append(button, outcome);
      row.append(action);
      body.append(row);
    }
    table.append(head, body);
    results.append(table);
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    controller?.abort();
    syllabusController?.abort();
    const request = new AbortController();
    controller = request;
    submit.disabled = true;
    queryInput.disabled = true;
    lessons = [];
    currentPage = 1;
    updatePagers(1, 0);
    results.replaceChildren();
    content.hidden = false;
    status.textContent = "正在加载课程目录…";
    try {
      lessons = await api.loadCatalog(catalogSelect.value, request.signal);
      if (request.signal.aborted) return;
      queryInput.disabled = false;
      render();
      if (root.open) queryInput.focus();
    } catch (error) {
      if (!request.signal.aborted) status.textContent = error.message;
    } finally {
      if (!request.signal.aborted) submit.disabled = false;
    }
  });
  queryInput.addEventListener("input", () => {
    currentPage = 1;
    render();
  });
  window.addEventListener("pagehide", () => {
    controller?.abort();
    syllabusController?.abort();
  }, { once: true });
})();

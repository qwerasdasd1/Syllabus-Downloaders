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
  let lessons = [];
  let controller;
  let syllabusController;

  function cell(tag, text) {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
  }

  catalogSelect.addEventListener("change", () => {
    controller?.abort();
    syllabusController?.abort();
    lessons = [];
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
    status.textContent = matches.length > 40
      ? `找到 ${matches.length} 个教学班，显示前 40 个。输入更具体的名称、代码或教师可缩小范围。`
      : `找到 ${matches.length} 个教学班。`;
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
    for (const lesson of matches.slice(0, 40)) {
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
  queryInput.addEventListener("input", render);
  window.addEventListener("pagehide", () => {
    controller?.abort();
    syllabusController?.abort();
  }, { once: true });
})();

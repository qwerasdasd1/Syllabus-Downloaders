"use strict";

const WestlakeSyllabusCatalog = (() => {
  const ORIGIN = "https://ams.westlake.edu.cn";

  function parseTurn(value) {
    const text = String(value).trim();
    const id = /^\d+$/.test(text) ? text : text.match(/\/turn\/(\d+)\/select(?:[/?#]|$)/)?.[1];
    if (!id || !/^[1-9]\d{0,8}$/.test(id)) {
      throw new Error("请输入选课批次编号，或粘贴之前打开的选课页面链接。");
    }
    return id;
  }

  async function readJSON(path, signal) {
    let response;
    try {
      response = await fetch(new URL(path, ORIGIN), {
        credentials: "same-origin",
        signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(20000)])
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new Error(error.name === "TimeoutError" ? "请求超时，请稍后重试。" : "暂时无法连接教学系统，请检查网络后重试。");
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("当前账号没有访问权限，或登录已失效。请先确认教学系统已登录。");
    }
    if (response.status === 404) throw new Error("系统没有提供这份课程目录或大纲资料。");
    if (!response.ok) throw new Error(`教学系统返回错误（${response.status}），请稍后重试。`);
    const text = await response.text();
    if (/^\s*</.test(text)) throw new Error("系统返回了登录页或错误页，请确认已登录教学系统。");
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("系统返回的数据格式发生变化，暂时无法读取。");
    }
  }

  async function loadCatalog(turn, signal) {
    const base = `/simplest-lessons/static/lessons/${parseTurn(turn)}/`;
    const version = await readJSON(`${base}version.json`, signal);
    if (!Array.isArray(version.itemList) || version.itemList.some(id => !/^[\w-]+$/.test(id))) {
      throw new Error("课程目录索引格式发生变化，暂时无法读取。");
    }
    const lessons = new Map();
    for (const part of new Set(version.itemList)) {
      const chunk = await readJSON(`${base}${part}.json`, signal);
      let rows;
      try { rows = typeof chunk.data === "string" ? JSON.parse(chunk.data) : chunk.data; } catch { /* validated below */ }
      if (!Array.isArray(rows)) throw new Error("课程目录内容格式发生变化，暂时无法读取。");
      for (const row of rows) {
        if (!Number.isSafeInteger(row.id) || row.id <= 0 || typeof row.courseName !== "string" || typeof row.courseCode !== "string") {
          throw new Error("课程目录中的课程信息不完整，暂时无法读取。");
        }
        lessons.set(row.id, row);
      }
    }
    return [...lessons.values()];
  }

  function filterLessons(lessons, query) {
    const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    return lessons.filter(lesson => {
      const text = [lesson.courseName, lesson.courseCode, lesson.lessonName, lesson.lessonCode, lesson.teacherName]
        .join(" ").toLocaleLowerCase();
      return terms.every(term => text.includes(term));
    });
  }

  function syllabusLinks(payload, lessonId) {
    if (!Number.isSafeInteger(lessonId) || lessonId <= 0) throw new Error("教学班编号无效。");
    const model = payload?.model ?? payload?.data?.model;
    if (!model) {
      if (payload?.message || payload?.errorMessage) throw new Error("系统未返回大纲资料，可能是当前账号无权访问。");
      return [];
    }
    const links = [];
    for (const [field, label] of [["fileInfo", "中文大纲附件"], ["enFileInfo", "英文大纲附件"]]) {
      const key = model[field]?.openKey;
      if (typeof key === "string" && key.length > 0) {
        links.push({ label, url: `${ORIGIN}/student/file/common/preview-by-open-key/${encodeURIComponent(key)}` });
      }
    }
    if (model.structuredDocument?.paragraphs?.length) {
      links.push({ label: "在线大纲", url: `${ORIGIN}/student/for-std/course-table/teaching-syllabus-zh/page/form/${lessonId}` });
    }
    return links;
  }

  async function loadSyllabus(lessonId, signal) {
    if (!Number.isSafeInteger(lessonId) || lessonId <= 0) throw new Error("教学班编号无效。");
    const payload = await readJSON(`/student/for-std/lesson-search/get-teaching-syllabus-data/${lessonId}`, signal);
    return syllabusLinks(payload, lessonId);
  }

  return { parseTurn, loadCatalog, filterLessons, syllabusLinks, loadSyllabus };
})();

if (typeof module !== "undefined") module.exports = WestlakeSyllabusCatalog;

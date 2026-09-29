"use strict";

const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const api = require("../src/catalog-data.js");
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

const lesson = { id: 2597, courseCode: "MATH2003", courseName: "抽象代数（上）|Abstract Algebra I", teacherName: "示例教师", lessonCode: "2610_MATH2003_example" };
const json = body => new Response(JSON.stringify(body));

test("only verified semester choices can load a catalog", async () => {
  assert.deepEqual(api.listCatalogs(), [{ id: "2026-1", label: "2026 年第 1 学期" }]);
  api.listCatalogs()[0].id = "changed";
  assert.equal(api.listCatalogs()[0].id, "2026-1");
  let calls = 0;
  global.fetch = async () => { calls++; };
  for (const value of ["", "121", "2025-1", "121/../122"]) {
    await assert.rejects(api.loadCatalog(value), /请选择可用的课程目录/);
  }
  assert.equal(calls, 0);
});

test("all published index chunks load and duplicate teaching classes merge", async () => {
  const requested = [];
  global.fetch = async (url, options) => {
    requested.push(url.pathname);
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.method, undefined); // GET only; no selection mutations.
    if (url.pathname.endsWith("version.json")) return json({ itemList: ["part-a", "part-b"] });
    if (url.pathname.endsWith("part-a.json")) return json({ data: JSON.stringify([lesson]) });
    return json({ data: JSON.stringify([lesson, { ...lesson, id: 2598, lessonCode: "second-class" }]) });
  };
  assert.equal((await api.loadCatalog("2026-1")).length, 2);
  assert.deepEqual(requested, [
    "/simplest-lessons/static/lessons/121/version.json",
    "/simplest-lessons/static/lessons/121/part-a.json",
    "/simplest-lessons/static/lessons/121/part-b.json"
  ]);
});

test("unexpected catalog paths and broken content fail without extra requests", async () => {
  let calls = 0;
  global.fetch = async () => { calls++; return json({ itemList: ["../../private"] }); };
  await assert.rejects(api.loadCatalog("2026-1"), /索引格式/);
  assert.equal(calls, 1);
  global.fetch = async url => url.pathname.endsWith("version.json") ? json({ itemList: ["part"] }) : json({ data: "not-json" });
  await assert.rejects(api.loadCatalog("2026-1"), /内容格式/);
});

test("search accepts Chinese, English, codes and multiple terms", () => {
  for (const query of ["抽象代数", "algebra", "math2003", "MATH2003 教师"]) {
    assert.equal(api.filterLessons([lesson], query).length, 1);
  }
  assert.equal(api.filterLessons([lesson], "不存在").length, 0);
});

test("file-only syllabi work when structuredDocument is absent", async () => {
  global.fetch = async url => {
    assert.equal(url.pathname, "/student/for-std/lesson-search/get-teaching-syllabus-data/2597");
    return json({ model: { fileInfo: { openKey: "test_@a@_key" }, enFileInfo: { openKey: "en/key?test" } } });
  };
  const links = await api.loadSyllabus(2597);
  assert.equal(links.length, 2);
  assert.ok(links[0].url.endsWith("/test_%40a%40_key"));
  assert.ok(links[1].url.endsWith("/en%2Fkey%3Ftest"));
  assert.equal(new URL(links[1].url).origin, "https://ams.westlake.edu.cn");
});

test("missing syllabi are distinct from structured online syllabi", () => {
  assert.deepEqual(api.syllabusLinks({ model: null }, 2597), []);
  assert.deepEqual(api.syllabusLinks({ model: {} }, 2597), []);
  const links = api.syllabusLinks({ model: { structuredDocument: { paragraphs: [{}] } } }, 2597);
  assert.equal(links[0].label, "在线大纲");
  assert.ok(links[0].url.endsWith("/form/2597"));
  assert.throws(() => api.syllabusLinks({}, "../../"), /编号无效/);
});

test("expired login and denied access are reported instead of an empty result", async () => {
  global.fetch = async () => new Response("<html>Login</html>");
  await assert.rejects(api.loadSyllabus(2597), /登录页或错误页/);
  global.fetch = async () => new Response("Forbidden", { status: 403 });
  await assert.rejects(api.loadSyllabus(2597), /没有访问权限/);
  global.fetch = async () => new Response("Server error", { status: 500 });
  await assert.rejects(api.loadSyllabus(2597), /500/);
});

test("a cancelled request preserves cancellation and starts no follow-up reads", async () => {
  const controller = new AbortController();
  controller.abort();
  global.fetch = async (url, options) => { options.signal.throwIfAborted(); };
  await assert.rejects(api.loadSyllabus(2597, controller.signal), { name: "AbortError" });
});

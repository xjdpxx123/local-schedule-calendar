// 本地日历｜零依赖本地单页应用
// 作者：xjdpxx123
// GitHub：github.com/xjdpxx123

(() => {
  /**
   * 版本策略说明（为后续迭代留窗口）：
   * - APP_VERSION：应用版本（展示用/导出包元信息）
   * - STATE_SCHEMA_VERSION：本地 state 数据结构版本（迁移用）
   * - BACKUP_SCHEMA_VERSION：备份结构版本（迁移用）
   *
   * 重要：本第一版不做多 key 兼容，只保留单一 STORAGE_KEY / BACKUP_KEY。
   * 后续迭代请通过 schemaVersion 做“内容迁移”，而不是换 key。
   */
  const APP_VERSION = "1.0.0";
  const STATE_SCHEMA_VERSION = 1;
  const BACKUP_SCHEMA_VERSION = 1;

  const STORAGE_KEY = "local_calendar_state";
  const BACKUP_KEY  = "local_calendar_backups";

  const $ = (id) => document.getElementById(id);
  const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const ymdCompact = (key) => key.replaceAll("-", "");
  const dateFromKey = (k) => {
    const [y, m, d] = (k || "").split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const clampInt = (v, a, b, fallback) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(a, Math.min(b, Math.trunc(n)));
  };

  function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
  }

  // ===== 国际化 =====
  const I18N = {
    zh: {
      langName: "中文",
      title: "本地日历｜零依赖本地单页",
      yearBadge: "年",
      searchBadge: "搜索",
      searchPH: "关键词：倒计时标题 / 任务内容",
      viewMonth: "月",
      viewWeek: "周",
      viewToday: "今日",
      todayJump: "今日",
      settings: "设置",
      themeSystem: "系统",
      themeDark: "暗",
      themeLight: "亮",
      themeBtn: (v) => `主题：${v}`,
      hideDone: "隐藏已完成",
      protectDel: "防删",
      protectAdd: "防增",
      backups: "备份",
      factoryReset: "出厂设置",
      recent3: "最近 3 条倒计时",
      all: "全部",
      lanesTitle: "代办事项栏",
      scope: "范围",
      manageScope: "管理范围",
      addLane: "新增代办栏",
      panelMonth: "月视图",
      panelWeek: "周视图",
      panelToday: "今日视图",
      dowMon: "一", dowTue: "二", dowWed: "三", dowThu: "四", dowFri: "五", dowSat: "六", dowSun: "日",
      weekPrefix: "周",
      localOnly: "数据仅保存在本地浏览器（localStorage）",

      drawerClose: "关闭",
      drawerCountdown: "倒计时",
      drawerTasks: "任务",
      clear: "清空",
      add: "添加",
      newTask: "新增",
      titleLabel: "标题",
      targetLabel: "目标",
      cdPH: "例如：考试 / 交稿",
      taskHint: "Enter 新增同级，Tab/Shift+Tab 调整层级",
      none: "无",
      delete: "删除",
      restore: "恢复",
      save: "保存",
      create: "创建",
      confirm: "确认",
      cancelled: "已取消",
      saved: "已保存",
      saveFailed: "保存失败：浏览器存储不可用或空间不足。",

      todayText: "就是今天",
      leftDays: (n) => `剩余 ${n} 天`,
      passedDays: (n) => `已过 ${n} 天`,

      close: "关闭",
      ok: "确认",

      settingsTitle: "设置",
      wkCdLimit: "周视图倒计时预览",
      wkTaskLimit: "周视图任务预览",
      cdSort: "倒计时排序",
      cdSortNear: "临近优先",
      cdSortDate: "按目标日期",
      language: "语言",
      shortcuts: "快捷键：/ 搜索，T 今日，M/W/D 视图，Esc 关闭弹层。",

      backupsTitle: "本地备份 / 迁移",
      backupsDesc: "保存/恢复/导入/导出均在本地完成（可用于多设备迁移）。恢复某个备份会丢弃其后的（更晚的）备份。",
      backupList: "备份列表",
      backupSave: "保存当前备份",
      backupExport: "导出 JSON",
      backupImport: "导入 JSON",
      backupNameTitle: "保存备份",
      backupNameDesc: "可自定义命名；留空或直接回车将按时间自动命名。",
      backupNamePH: "输入备份名称（可留空）",
      backupDeleteTitle: "删除备份",
      backupDeleteDesc: (name, time) => `即将删除：${name}\n时间：${time}\n为防止误删，请输入 DELETE 后确认。`,
      backupRestoreTitle: "恢复备份",
      backupRestoreDesc: (name, time) => `确认恢复：${name}\n时间：${time}\n恢复后将丢弃该备份之后（更晚）的备份。`,
      backupDeleted: "已删除备份",
      backupRestored: "已恢复备份",
      backupSaved: "已保存备份",
      tokenDelete: "DELETE",

      exportTitle: "导出数据",
      exportDone: "已导出 JSON",
      importTitle: "导入数据",
      importDesc: "选择你之前导出的 JSON 文件。导入会覆盖本机当前数据（state），可选覆盖备份列表。",
      importPickFile: "选择文件",
      importPaste: "或粘贴 JSON",
      importPH: "在此粘贴 JSON 内容（可选）",
      importDo: "导入",
      importInvalid: "导入失败：文件内容不是有效的日历数据。",
      importConfirmTitle: "确认导入",
      importConfirmDesc: "导入将覆盖当前本机数据。建议先导出一次作为备份。",
      importSuccess: "导入成功",

      resetTitle: "出厂设置",
      resetStep1: "此操作将清空本页面所有本地数据。第一步确认：请输入 YES 表示你理解该操作会删除本地数据。",
      resetStep2: "第二步确认：请输入 RESET 继续执行（不可恢复）。",
      resetDone: "已恢复出厂设置",
      tokenYes: "YES",
      tokenReset: "RESET",

      noResult: "无结果",

      tipAdd: "已开启防增",
      tipDel: "已开启防删",

      countdownLabel: "倒计时",
      taskLabel: "任务",

      todayCdTitle: "近期倒计时",
      todayCdWithinPrefix: "距离今日不到",
      todayCdWithinSuffix: "天",
      todayTaskTitle: "今日计划",
      edit: "编辑",

      scopeWeek: "本周",
      scopeMonth: "本月",
      scopeYear: "本年",

      helpYearInput: "年份输入：支持 1~9999。回车或失焦后生效。",
      helpMonthSelect: "月份选择：切换月视图，并将选中日期定位到该月 01 日。",
      helpSearchInput: "搜索：输入关键词即可在所有日期中查找倒计时标题与任务内容。快捷键：/。",
      helpViewSwitch: "视图切换：月/周/今日。快捷键：M/W/D。",
      helpViewMonth: "月视图：按月网格浏览，点击日期打开右侧抽屉编辑。",
      helpViewWeek: "周视图：展示一周 7 天摘要（倒计时/任务预览）。",
      helpViewToday: "今日视图：展示近期倒计时与今日计划。",
      helpTodayJump: "跳转到今天：快速回到今日所在的年月与日期。快捷键：T。",
      helpSettings: "设置：调整周视图预览数量、倒计时排序、语言等。",
      helpTheme: "主题：在“系统/暗/亮”三种模式中循环切换。",
      helpHideDone: "隐藏已完成：开启后，已完成任务在列表里不显示（数据仍保留）。",
      helpHideDoneSwitch: "开关：隐藏已完成任务。",
      helpProtectDel: "防删：开启后将禁止删除/清空/恢复等破坏性操作，用于防误触。",
      helpProtectDelSwitch: "开关：防删（锁定删除相关按钮）。",
      helpProtectAdd: "防增：开启后将禁止新增倒计时/任务/代办栏等操作，用于防误触。",
      helpProtectAddSwitch: "开关：防增（锁定新增相关按钮）。",
      helpBackups: "备份/迁移：可保存本地备份、恢复旧备份，也可导出/导入 JSON 用于多设备迁移。",
      helpFactoryReset: "出厂设置：清空本页面所有本地数据（不可恢复）。建议先导出 JSON。",
      helpGithub: "打开作者 GitHub 页面。",
      helpAllCountdowns: "查看全部倒计时：按设置排序展示，并可点击跳转到对应日期。",
      helpLaneScope: "范围：用于创建代办栏的分类（本周/本月/本年/自定义）。",
      helpManageScopes: "管理范围：新增/删除自定义范围（删除范围会同时删除该范围下的代办栏）。",
      helpAddLane: "新增代办栏：在当前所选范围下创建（或跳转到已有同名栏）。",

      helpTodayWithinDays: "“距离今日不到 N 天”：用于筛选今日视图中的近期倒计时（只看今天及未来）。",
      helpTodayWithinDaysInput: "输入天数阈值：回车或失焦后保存。",
      helpTodayEdit: "编辑今日计划：打开今日日期的抽屉，编辑倒计时与任务。",

      helpDrawerClose: "关闭抽屉：Esc 也可关闭。",
      helpClearCountdowns: "清空倒计时：删除当天所有倒计时（受防删影响）。",
      helpCountdownTitle: "倒计时标题：例如“考试/交稿”。回车可快速添加。",
      helpCountdownTarget: "倒计时目标日期：选择或手动输入 YYYY-MM-DD。",
      helpAddCountdown: "添加倒计时：新增到当前日期（受防增影响）。",
      helpAddRootTask: "新增任务：在当前日期新增一个同级任务（受防增影响）。",
      helpClearTasks: "清空任务：删除当天所有任务（受防删影响）。",
    },
    en: {
      langName: "English",
      title: "Local Calendar | Zero-dependency SPA",
      yearBadge: "Year",
      searchBadge: "Search",
      searchPH: "Keyword: countdown title / task content",
      viewMonth: "Month",
      viewWeek: "Week",
      viewToday: "Today",
      todayJump: "Today",
      settings: "Settings",
      themeSystem: "System",
      themeDark: "Dark",
      themeLight: "Light",
      themeBtn: (v) => `Theme: ${v}`,
      hideDone: "Hide done",
      protectDel: "Protect delete",
      protectAdd: "Protect add",
      backups: "Backups",
      factoryReset: "Factory reset",
      recent3: "Top 3 Countdowns",
      all: "All",
      lanesTitle: "Task Lanes",
      scope: "Scope",
      manageScope: "Manage scopes",
      addLane: "Add lane",
      panelMonth: "Month view",
      panelWeek: "Week view",
      panelToday: "Today view",
      dowMon: "Mon", dowTue: "Tue", dowWed: "Wed", dowThu: "Thu", dowFri: "Fri", dowSat: "Sat", dowSun: "Sun",
      weekPrefix: "",
      localOnly: "Data is stored locally in your browser (localStorage)",

      drawerClose: "Close",
      drawerCountdown: "Countdowns",
      drawerTasks: "Tasks",
      clear: "Clear",
      add: "Add",
      newTask: "New",
      titleLabel: "Title",
      targetLabel: "Target",
      cdPH: "e.g., Exam / Deadline",
      taskHint: "Enter: new sibling. Tab/Shift+Tab: indent/outdent.",
      none: "None",
      delete: "Delete",
      restore: "Restore",
      save: "Save",
      create: "Create",
      confirm: "Confirm",
      cancelled: "Cancelled",
      saved: "Saved",
      saveFailed: "Save failed: localStorage unavailable or quota exceeded.",

      todayText: "Today",
      leftDays: (n) => `${n} days left`,
      passedDays: (n) => `${n} days passed`,

      close: "Close",
      ok: "OK",

      settingsTitle: "Settings",
      wkCdLimit: "Week countdown preview",
      wkTaskLimit: "Week task preview",
      cdSort: "Countdown sort",
      cdSortNear: "Nearest first",
      cdSortDate: "By target date",
      language: "Language",
      shortcuts: "Shortcuts: / search, T today, M/W/D view, Esc close.",

      backupsTitle: "Local Backups / Migration",
      backupsDesc: "Save/restore/import/export are all local (useful for multi-device migration). Restoring a backup discards newer backups after it.",
      backupList: "Backup list",
      backupSave: "Save backup",
      backupExport: "Export JSON",
      backupImport: "Import JSON",
      backupNameTitle: "Save Backup",
      backupNameDesc: "Custom name optional; leave empty / press Enter to auto-name by time.",
      backupNamePH: "Backup name (optional)",
      backupDeleteTitle: "Delete Backup",
      backupDeleteDesc: (name, time) => `You are deleting:\n${name}\nTime: ${time}\nTo prevent mistakes, type DELETE to continue.`,
      backupRestoreTitle: "Restore Backup",
      backupRestoreDesc: (name, time) => `Restore:\n${name}\nTime: ${time}\nNewer backups after this one will be discarded.`,
      backupDeleted: "Backup deleted",
      backupRestored: "Backup restored",
      backupSaved: "Backup saved",
      tokenDelete: "DELETE",

      exportTitle: "Export data",
      exportDone: "JSON exported",
      importTitle: "Import data",
      importDesc: "Pick a previously exported JSON file. Import overwrites current local state; backups may also be overwritten.",
      importPickFile: "Choose file",
      importPaste: "Or paste JSON",
      importPH: "Paste JSON here (optional)",
      importDo: "Import",
      importInvalid: "Import failed: invalid calendar data.",
      importConfirmTitle: "Confirm import",
      importConfirmDesc: "Import will overwrite current local data. It is recommended to export once before importing.",
      importSuccess: "Import successful",

      resetTitle: "Factory Reset",
      resetStep1: "This will wipe all local data for this page. Step 1: type YES to confirm you understand.",
      resetStep2: "Step 2: type RESET to proceed (irreversible).",
      resetDone: "Factory reset completed",
      tokenYes: "YES",
      tokenReset: "RESET",

      noResult: "No results",

      tipAdd: "Protect add is ON",
      tipDel: "Protect delete is ON",

      countdownLabel: "Countdowns",
      taskLabel: "Tasks",

      todayCdTitle: "Upcoming Countdowns",
      todayCdWithinPrefix: "Within",
      todayCdWithinSuffix: "days",
      todayTaskTitle: "Today's Plan",
      edit: "Edit",

      scopeWeek: "This week",
      scopeMonth: "This month",
      scopeYear: "This year",

      helpYearInput: "Year input: supports 1–9999. Applies on Enter or blur.",
      helpMonthSelect: "Month selector: switches month view and anchors selected date to day 01.",
      helpSearchInput: "Search: find countdown titles and task texts across all dates. Shortcut: /",
      helpViewSwitch: "View switch: Month/Week/Today. Shortcuts: M/W/D.",
      helpViewMonth: "Month view: click a day to open the drawer and edit.",
      helpViewWeek: "Week view: 7-day overview with countdown/task previews.",
      helpViewToday: "Today view: upcoming countdowns and today's plan.",
      helpTodayJump: "Jump to today: quickly go back to today's date. Shortcut: T.",
      helpSettings: "Settings: adjust preview limits, countdown sort, language, etc.",
      helpTheme: "Theme: cycles through System/Dark/Light.",
      helpHideDone: "Hide done: completed tasks are hidden (data remains).",
      helpHideDoneSwitch: "Toggle: hide completed tasks.",
      helpProtectDel: "Protect delete: disables destructive actions like delete/clear/restore.",
      helpProtectDelSwitch: "Toggle: protect delete.",
      helpProtectAdd: "Protect add: disables creation actions like adding tasks/countdowns/lanes.",
      helpProtectAddSwitch: "Toggle: protect add.",
      helpBackups: "Backups/Migration: save local backups, restore, and import/export JSON for multi-device migration.",
      helpFactoryReset: "Factory reset: wipes all local data (irreversible). Export JSON first if needed.",
      helpGithub: "Open the author’s GitHub page.",
      helpAllCountdowns: "All countdowns: view the full list and click to jump to the date.",
      helpLaneScope: "Scope: category for lanes (week/month/year/custom).",
      helpManageScopes: "Manage scopes: add/remove custom scopes (removing a scope deletes its lanes).",
      helpAddLane: "Add lane: create (or jump to) a lane under the selected scope.",

      helpTodayWithinDays: "“Within N days”: filters upcoming countdowns in Today view (today + future only).",
      helpTodayWithinDaysInput: "Threshold input: saved on Enter or blur.",
      helpTodayEdit: "Edit today: opens today’s drawer for editing countdowns and tasks.",

      helpDrawerClose: "Close drawer: Esc also works.",
      helpClearCountdowns: "Clear countdowns: removes all countdowns of the day (blocked by Protect delete).",
      helpCountdownTitle: "Countdown title: e.g., Exam/Deadline. Enter to quickly add.",
      helpCountdownTarget: "Target date: pick or type YYYY-MM-DD.",
      helpAddCountdown: "Add countdown: adds to the selected date (blocked by Protect add).",
      helpAddRootTask: "New task: adds a root-level task for the selected date (blocked by Protect add).",
      helpClearTasks: "Clear tasks: removes all tasks of the day (blocked by Protect delete).",
    }
  };

  function detectLang() {
    const n = (navigator.language || "").toLowerCase();
    return n.startsWith("zh") ? "zh" : "en";
  }

  function todayKey() {
    return ymd(new Date());
  }

  // ===== 状态（state）与存储 =====
  function defaultState() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const dk = ymd(now);

    return {
      schemaVersion: STATE_SCHEMA_VERSION,
      appVersion: APP_VERSION,

      lang: detectLang(),
      theme: "system",
      protectDelete: false,
      protectAdd: false,
      hideDone: false,
      view: "month",
      currentYear: y,
      currentMonth: m,
      selectedDate: dk,
      byDate: {},

      lanes: [{ id: uid(), label: "本周", scope: "本周", tasks: [] }],
      activeLaneId: null,

      scopeOptions: ["本周", "本月", "本年"],
      customScopes: [],

      settings: {
        previewCountdownLimit: 4,
        previewTaskLimit: 6,
        countdownSort: "near",
        todayCountdownWithinDays: 10
      }
    };
  }

  function isPlainObject(x) {
    return !!x && typeof x === "object" && !Array.isArray(x);
  }

  function normalizeDateKey(k, fallbackKey) {
    if (typeof k !== "string") return fallbackKey;
    const m = k.match(/^(\d{1,4})-(\d{2})-(\d{2})$/);
    if (!m) return fallbackKey;
    const y = clampInt(m[1], 1, 9999, null);
    const mo = clampInt(m[2], 1, 12, null);
    const d = clampInt(m[3], 1, 31, null);
    if (y === null || mo === null || d === null) return fallbackKey;
    return `${String(y).padStart(4, "0")}-${pad2(mo)}-${pad2(d)}`;
  }

  /**
   * 迁移入口：后续版本升级请在这里按 schemaVersion 做“逐步迁移”。
   * 不建议换 key；只需要保持 STORAGE_KEY 不变即可。
   */
  function migrateState(oldState) {
    const base = defaultState();
    if (!isPlainObject(oldState)) return base;

    // 1) 合并旧数据
    let s = { ...base, ...oldState };

    // 2) schemaVersion 兜底（早期/外部导入可能没有）
    const from = clampInt(oldState.schemaVersion ?? 1, 1, 9999, 1);

    // 3) 逐版本迁移窗口（当前仅 v1，无动作）
    // if (from < 2) { ... } // 示例：迁移到 v2
    // if (from < 3) { ... } // 示例：迁移到 v3

    // 4) 标准化/修复字段（任何版本都执行）
    if (s.lang !== "zh" && s.lang !== "en") s.lang = base.lang;

    s.settings = { ...base.settings, ...(oldState.settings || {}) };
    s.settings.previewCountdownLimit = clampInt(s.settings.previewCountdownLimit, 1, 12, base.settings.previewCountdownLimit);
    s.settings.previewTaskLimit = clampInt(s.settings.previewTaskLimit, 1, 20, base.settings.previewTaskLimit);
    s.settings.countdownSort = (s.settings.countdownSort === "date") ? "date" : "near";
    s.settings.todayCountdownWithinDays = clampInt(s.settings.todayCountdownWithinDays, 1, 3650, base.settings.todayCountdownWithinDays);

    if (!Array.isArray(s.lanes)) s.lanes = [];
    if (!Array.isArray(s.scopeOptions)) s.scopeOptions = ["本周", "本月", "本年"];
    if (!Array.isArray(s.customScopes)) s.customScopes = [];
    if (!isPlainObject(s.byDate)) s.byDate = {};

    const tk = todayKey();
    s.selectedDate = normalizeDateKey(s.selectedDate, tk);
    const sd = dateFromKey(s.selectedDate);

    s.currentYear = clampInt(s.currentYear, 1, 9999, sd.getFullYear());
    s.currentMonth = clampInt(s.currentMonth, 0, 11, sd.getMonth());

    if (!s.activeLaneId && s.lanes.length) s.activeLaneId = s.lanes[0].id;

    s.schemaVersion = STATE_SCHEMA_VERSION;
    s.appVersion = APP_VERSION;
    return s;
  }

  function tryParseJson(raw) {
    try { return JSON.parse(raw); } catch { return null; }
  }

  function looksLikeState(obj) {
    if (!isPlainObject(obj)) return false;
    if (!("byDate" in obj) && !("lanes" in obj) && !("selectedDate" in obj)) return false;
    return true;
  }

  function looksLikeBackups(arr) {
    if (!Array.isArray(arr)) return false;
    return arr.every(b => b && typeof b === "object" && b.id && b.createdAt && b.data);
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();

    const parsed = tryParseJson(raw);
    if (!parsed || Array.isArray(parsed) || !looksLikeState(parsed)) return defaultState();

    const s = migrateState(parsed);

    // 写回（用于补齐/修复字段）
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
    return s;
  }

  let state = loadState();
  if (!state.activeLaneId && state.lanes?.length) state.activeLaneId = state.lanes[0].id;

  function L() { return I18N[state.lang] || I18N.zh; }
  function t(key, ...args) {
    const v = L()[key];
    return typeof v === "function" ? v(...args) : (v ?? key);
  }

  // ===== 范围显示（内置范围的国际化） =====
  function presetScopeKey(name) {
    const n = (name || "").trim();
    if (!n) return null;
    const low = n.toLowerCase();
    if (n === "本周" || low === "this week") return "scopeWeek";
    if (n === "本月" || low === "this month") return "scopeMonth";
    if (n === "本年" || low === "this year") return "scopeYear";
    return null;
  }

  function scopeDisplay(name) {
    const k = presetScopeKey(name);
    return k ? t(k) : (name || "");
  }

  // ===== 通用 state 变更入口 =====
  let _saveTimer = null;
  function saveSoon() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(saveState, 120);
  }
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      openModal({
        title: t("saveFailed"),
        desc: "",
        bodyHTML: "",
        actions: [{ text: t("close"), className: "", isDefault: true }]
      });
    }
  }
  function mutate(fn, { save = true, render = true } = {}) {
    fn(state);
    if (save) saveSoon();
    if (render) renderAll();
  }
  function setState(partial, { save = true, render = true } = {}) {
    mutate((s) => Object.assign(s, partial), { save, render });
  }

  // ===== 日期数据仓库（byDate） =====
  function ensureDay(dateKey) {
    if (!state.byDate[dateKey]) state.byDate[dateKey] = { countdowns: [], tasks: [] };
    const d = state.byDate[dateKey];
    if (!Array.isArray(d.countdowns)) d.countdowns = [];
    if (!Array.isArray(d.tasks)) d.tasks = [];
    return d;
  }

  function addLocked() { return !!state.protectAdd; }
  function delLocked() { return !!state.protectDelete; }

  // ===== 主题 =====
  function applyTheme() {
    const prefDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    let effective = state.theme;
    if (effective === "system") effective = prefDark ? "dark" : "light";
    document.documentElement.dataset.theme = (effective === "dark") ? "" : "light";

    const label =
      state.theme === "system" ? t("themeSystem") :
      state.theme === "dark" ? t("themeDark") : t("themeLight");

    $("themeBtn").textContent = t("themeBtn", label);
  }
  function cycleTheme() {
    setState({
      theme: (state.theme === "system") ? "dark" : (state.theme === "dark") ? "light" : "system"
    }, { save: true, render: false });
    applyTheme();
    toast(t("saved"));
  }

  // ===== 开关控件 =====
  function setSwitch(el, on) {
    el.dataset.on = on ? "true" : "false";
    el.setAttribute("aria-checked", on ? "true" : "false");
  }

  // ===== Toast 提示 =====
  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => el.classList.remove("show"), 1400);
  }

  // ===== 弹窗（Enter=确认，支持阻止关闭） =====
  const modalCtx = { onClose: null, keyHandler: null, defaultBtn: null };

  function closeModal() {
    $("modalMask").classList.remove("show");
    $("modal").classList.remove("show");

    if (modalCtx.keyHandler) {
      document.removeEventListener("keydown", modalCtx.keyHandler, true);
      modalCtx.keyHandler = null;
    }

    const cb = modalCtx.onClose;
    modalCtx.onClose = null;
    modalCtx.defaultBtn = null;

    if (typeof cb === "function") cb();
  }

  function openModal({ title = "提示", desc = "", bodyHTML = "", actions = [], onClose = null }) {
    $("modalTitle").textContent = title;
    $("modalDesc").textContent = desc;
    $("modalBody").innerHTML = bodyHTML;

    const foot = $("modalFoot");
    foot.innerHTML = "";
    modalCtx.defaultBtn = null;

    actions.forEach((a, idx) => {
      const btn = document.createElement("button");
      btn.className = `btn ${a.className || ""}`.trim();
      btn.textContent = a.text;
      btn.disabled = !!a.disabled;

      btn.onclick = () => {
        try {
          const ret = a.onClick ? a.onClick() : undefined;

          const finish = (r) => {
            // onClick 显式返回 false：阻止关闭（例如校验失败）
            if (r === false) return;

            // closeOnClick === false：由调用方自行决定何时 closeModal()
            if (a.closeOnClick === false) return;

            closeModal();
          };

          // 仅当 onClick 返回 Promise 时才异步等待
          if (ret && typeof ret.then === "function") {
            ret.then(finish).catch((err) => {
              console.error(err);
              toast(state.lang === "en" ? "Operation failed" : "操作失败");
            });
          } else {
            finish(ret);
          }
        } catch (err) {
          console.error(err);
          toast(state.lang === "en" ? "Operation failed" : "操作失败");
        }
      };

      foot.appendChild(btn);

      if (!modalCtx.defaultBtn && (a.isDefault || idx === 0)) {
        modalCtx.defaultBtn = btn;
      }
    });

    modalCtx.onClose = onClose;

    $("modalMask").classList.add("show");
    $("modal").classList.add("show");

    modalCtx.keyHandler = (e) => {
      if (e.key !== "Enter") return;
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "textarea") return;
      if (!modalCtx.defaultBtn || modalCtx.defaultBtn.disabled) return;
      e.preventDefault();
      modalCtx.defaultBtn.click();
    };
    document.addEventListener("keydown", modalCtx.keyHandler, true);

    $("modalMask").onclick = closeModal;
    $("btnModalClose").onclick = closeModal;
  }

  function confirmDialog({ title, desc, confirmText, danger = true }) {
    return new Promise((resolve) => {
      openModal({
        title,
        desc,
        bodyHTML: "",
        actions: [{
          text: confirmText || t("confirm"),
          className: danger ? "danger" : "primary",
          isDefault: true,
          onClick: () => { resolve(true); }
        }],
        onClose: () => resolve(false)
      });
    });
  }

  function inputGate({ title, desc, placeholder, expect, danger = true }) {
    return new Promise((resolve) => {
      openModal({
        title,
        desc,
        bodyHTML: `
          <div class="row">
            <div class="field" style="flex:1 1 420px;">
              <span class="kbd">${escapeHtml(t("confirm"))}</span>
              <input id="gateInput" type="text" placeholder="${escapeAttr(placeholder || "")}" />
            </div>
          </div>
          <div style="color:var(--muted);font-size:12px;margin-top:8px;">
            ${escapeHtml(t("confirm"))}：<span class="kbd">${escapeHtml(expect)}</span>
          </div>
        `,
        actions: [{
          text: t("confirm"),
          className: danger ? "danger" : "primary",
          isDefault: true,
          onClick: () => {
            const v = ($("gateInput")?.value || "").trim();
            if (v !== expect) {
              toast(t("cancelled"));
              return false;
            }
            resolve(true);
          }
        }],
        onClose: () => resolve(false)
      });

      setTimeout(() => $("gateInput")?.focus(), 0);
    });
  }

  // ===== 新手提示气泡 =====
  const hintCtx = { el: null, pinned: false, lastTarget: null, hideTimer: null };

  function initHint() {
    hintCtx.el = $("hint");
  }

  function getHelpTextFromElement(el) {
    const key = el?.getAttribute?.("data-help-key");
    if (!key) return "";
    return t(key);
  }

  function showHintFor(el) {
    if (!hintCtx.el || !el) return;
    const text = getHelpTextFromElement(el);
    if (!text) return;

    const rect = el.getBoundingClientRect();
    const bubble = hintCtx.el;
    bubble.innerHTML = `<div class="hBody">${escapeHtml(text)}</div>`;

    bubble.classList.add("show");

    // 计算位置：默认在元素下方；超出则上方；左右夹紧
    const margin = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 先让其渲染，拿到尺寸
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;

    let left = rect.left + rect.width / 2 - bw / 2;
    left = Math.max(margin, Math.min(vw - bw - margin, left));

    let top = rect.bottom + 10;
    if (top + bh + margin > vh) top = rect.top - bh - 10;
    top = Math.max(margin, Math.min(vh - bh - margin, top));

    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
    hintCtx.lastTarget = el;
  }

  function hideHint({ force = false } = {}) {
    if (!hintCtx.el) return;
    if (!force && hintCtx.pinned) return;
    hintCtx.el.classList.remove("show");
    hintCtx.el.style.left = "";
    hintCtx.el.style.top = "";
    hintCtx.lastTarget = null;
  }

  function bindHelp(el) {
    if (!el) return;

    const onFocus = () => { hintCtx.pinned = true; showHintFor(el); };
    const onBlur = () => { hintCtx.pinned = false; hideHint({ force: false }); };

    const onEnter = () => {
      clearTimeout(hintCtx.hideTimer);
      hintCtx.pinned = false;
      showHintFor(el);
    };
    const onLeave = () => {
      clearTimeout(hintCtx.hideTimer);
      hintCtx.hideTimer = setTimeout(() => {
        if (!hintCtx.pinned) hideHint({ force: true });
      }, 120);
    };

    el.addEventListener("focus", onFocus);
    el.addEventListener("blur", onBlur);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
  }

  function bindHelpAll() {
    const nodes = document.querySelectorAll("[data-help-key]");
    nodes.forEach(bindHelp);
  }

  // ===== 文案刷新（i18n 应用到 DOM） =====
  function applyI18n() {
    document.documentElement.lang = (state.lang === "en") ? "en" : "zh-CN";
    document.title = t("title");

    $("yearBadge").textContent = t("yearBadge");
    const yi = $("yearInput");
    if (yi && document.activeElement !== yi) yi.value = String(state.currentYear);

    $("searchBadge").textContent = t("searchBadge");
    $("searchInput").placeholder = t("searchPH");

    $("viewMonth").textContent = t("viewMonth");
    $("viewWeek").textContent = t("viewWeek");
    $("viewToday").textContent = t("viewToday");
    $("btnTodayJump").textContent = t("todayJump");
    $("btnSettings").title = t("settings");

    $("labelHideDone").textContent = t("hideDone");
    $("labelProtectDel").textContent = t("protectDel");
    $("labelProtectAdd").textContent = t("protectAdd");

    $("btnBackups").textContent = t("backups");
    $("btnBackups").title = t("backupsTitle");
    $("btnFactoryReset").textContent = t("factoryReset");
    $("btnFactoryReset").title = t("resetTitle");

    $("cdTopTitle").textContent = t("recent3");
    $("btnAllCountdowns").textContent = t("all");

    $("lanesTitle").textContent = t("lanesTitle");
    $("scopeBadge").textContent = t("scope");
    $("btnManageScopes").textContent = t("manageScope");
    $("btnAddLane").textContent = t("addLane");

    const dows = [t("dowMon"), t("dowTue"), t("dowWed"), t("dowThu"), t("dowFri"), t("dowSat"), t("dowSun")];
    document.querySelectorAll(".dow > div").forEach((el, i) => { el.textContent = dows[i] || ""; });

    $("drawerCloseBtn").textContent = t("drawerClose");
    $("btnClearCountdowns").textContent = t("clear");
    $("btnAddCountdown").textContent = t("add");
    $("btnClearTasks").textContent = t("clear");
    $("btnAddRootTask").textContent = t("newTask");
    $("drawerCdTitle").textContent = t("drawerCountdown");
    $("drawerTaskTitle").textContent = t("drawerTasks");
    $("cdTitleBadge").textContent = t("titleLabel");
    $("cdTargetBadge").textContent = t("targetLabel");
    $("cdTitle").placeholder = t("cdPH");
    $("drawerTaskHint").textContent = t("taskHint");

    $("todayH1").textContent = t("viewToday");
    $("todayCdTitle").textContent = t("todayCdTitle");
    $("todayCdWithinPrefix").textContent = t("todayCdWithinPrefix");
    $("todayCdWithinSuffix").textContent = t("todayCdWithinSuffix");
    $("todayTaskTitle").textContent = t("todayTaskTitle");
    $("btnOpenTodayDrawer").textContent = t("edit");

    $("footerNote").textContent = t("localOnly");

    applyTheme();
  }

  // ===== 视图切换与渲染入口 =====
  function renderView() {
    $("monthView").style.display = state.view === "month" ? "" : "none";
    $("weekView").style.display = state.view === "week" ? "" : "none";
    $("todayView").style.display = state.view === "today" ? "" : "none";

    $("viewMonth").classList.toggle("active", state.view === "month");
    $("viewWeek").classList.toggle("active", state.view === "week");
    $("viewToday").classList.toggle("active", state.view === "today");

    $("panelTitle").textContent =
      state.view === "month" ? t("panelMonth") :
      state.view === "week" ? t("panelWeek") : t("panelToday");
  }

  function setView(v) { setState({ view: v }, { save: true, render: true }); }

  // ===== 月份下拉 =====
  const MONTHS_ZH = ["01 月","02 月","03 月","04 月","05 月","06 月","07 月","08 月","09 月","10 月","11 月","12 月"];
  const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function renderMonthSelect() {
    const sel = $("monthSelect");
    sel.innerHTML = "";
    const names = (state.lang === "en") ? MONTHS_EN : MONTHS_ZH;
    for (let i = 0; i < 12; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = names[i];
      sel.appendChild(opt);
    }
    sel.value = String(state.currentMonth);
  }

  // ===== 日期状态标记（过去/未来/今天） =====
  function dayHasData(dateKey) {
    const day = state.byDate[dateKey];
    if (!day) return { cd: 0, tasks: 0, done: 0 };
    const cd = (day.countdowns || []).length;
    let tasks = 0, done = 0;
    walkTasks(day.tasks || [], (n) => { tasks++; if (n.done) done++; });
    return { cd, tasks, done };
  }

  // ===== 倒计时天数差计算（按天） =====
  function dayDiffText(targetKey) {
    const now = new Date();
    const now0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const t1 = dateFromKey(targetKey);
    const t0 = new Date(t1.getFullYear(), t1.getMonth(), t1.getDate()).getTime();
    const diffDays = Math.round((t0 - now0) / (24 * 3600 * 1000));
    if (diffDays === 0) return { text: t("todayText"), sortDays: 0 };
    if (diffDays > 0) return { text: t("leftDays", diffDays), sortDays: diffDays };
    return { text: t("passedDays", Math.abs(diffDays)), sortDays: diffDays };
  }

  function walkTasks(nodes, fn) {
    (nodes || []).forEach(n => {
      fn(n);
      if (n.children?.length) walkTasks(n.children, fn);
    });
  }

  function allCountdowns() {
    const arr = [];
    for (const [dateKey, day] of Object.entries(state.byDate)) {
      for (const cd of (day.countdowns || [])) {
        if (!cd?.targetDate) continue;
        const dt = dayDiffText(cd.targetDate);
        arr.push({ ...cd, dateKey, ...dt });
      }
    }
    if (state.settings.countdownSort === "date") {
      arr.sort((a, b) => (a.targetDate || "").localeCompare(b.targetDate || "") || (a.dateKey || "").localeCompare(b.dateKey || ""));
      return arr;
    }
    arr.sort((a, b) => {
      const af = a.sortDays >= 0, bf = b.sortDays >= 0;
      if (af !== bf) return af ? -1 : 1;
      if (af) return a.sortDays - b.sortDays;
      return Math.abs(a.sortDays) - Math.abs(b.sortDays);
    });
    return arr;
  }

  // ===== 日期格式化（人类可读） =====
  function formatHuman(key) {
    const d = dateFromKey(key);
    const dowMapZh = ["日","一","二","三","四","五","六"];
    const dowMapEn = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const dow = (state.lang === "en") ? dowMapEn[d.getDay()] : dowMapZh[d.getDay()];
    if (state.lang === "en") return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} (${dow})`;
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} 周${dow}`;
  }

  // ===== 月视图网格 =====
  function renderMonthGrid() {
    const grid = $("monthGrid");
    grid.innerHTML = "";

    const y = state.currentYear;
    const m = state.currentMonth;

    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const daysInMonth = last.getDate();
    const firstIdx = (first.getDay() + 6) % 7;

    const todayK = todayKey();
    const now = new Date();
    const now0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    for (let i = 0; i < 42; i++) {
      const dayNum = i - firstIdx + 1;
      const cell = document.createElement("div");
      cell.className = "cell";

      if (dayNum < 1 || dayNum > daysInMonth) {
        cell.style.visibility = "hidden";
        grid.appendChild(cell);
        continue;
      }

      const dateKey = `${String(y).padStart(4, "0")}-${pad2(m + 1)}-${pad2(dayNum)}`;
      const marks = dayHasData(dateKey);

      const isToday = todayK === dateKey;
      const d0 = dateFromKey(dateKey);
      const d0t = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate()).getTime();

      if (isToday) cell.classList.add("today");
      else if (d0t < now0) cell.classList.add("past");
      else cell.classList.add("future");

      cell.innerHTML = `
        <div class="num">${dayNum}</div>
        <div class="marks">
          ${marks.cd ? `<span class="dot green" title="${escapeAttr(t("countdownLabel"))}"></span>` : ``}
          ${marks.tasks ? `<span class="dot" title="${escapeAttr(t("taskLabel"))}"></span>` : ``}
          ${(marks.tasks && marks.done === marks.tasks) ? `<span class="dot warn" title="done"></span>` : ``}
        </div>
        <div class="mini">
          ${marks.cd ? `<div class="line"><span class="tag">${escapeHtml(t("countdownLabel"))}</span><span>${marks.cd}</span></div>` : ``}
          ${marks.tasks ? `<div class="line"><span class="tag">${escapeHtml(t("taskLabel"))}</span><span>${marks.done}/${marks.tasks}</span></div>` : ``}
        </div>
      `;
      cell.onclick = () => openDrawer(dateKey);
      grid.appendChild(cell);
    }
  }

  // ===== 周视图 =====
  function startOfWeek(dateObj) {
    const d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const idx = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - idx);
    return d;
  }

  function renderWeek() {
    const wrap = $("weekGrid");
    wrap.innerHTML = "";

    const fallback = `${String(state.currentYear).padStart(4, "0")}-${pad2(state.currentMonth + 1)}-01`;
    const ref = dateFromKey(state.selectedDate || fallback);
    const start = startOfWeek(ref);

    const todayK = todayKey();
    const now = new Date();
    const now0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const cdLimit = state.settings.previewCountdownLimit;
    const taskLimit = state.settings.previewTaskLimit;

    const dowMapZh = ["日","一","二","三","四","五","六"];
    const dowMapEn = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const dk = ymd(d);

      const col = document.createElement("div");
      col.className = "dayCol";

      const d0t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      if (dk === todayK) col.classList.add("today");
      else if (d0t < now0) col.classList.add("past");
      else col.classList.add("future");

      const head = document.createElement("div");
      head.className = "dayHead";

      const dow = (state.lang === "en") ? dowMapEn[d.getDay()] : dowMapZh[d.getDay()];
      const d1 = (state.lang === "en") ? dow : `${t("weekPrefix")}${dow}`;

      head.innerHTML = `
        <div class="d1">${escapeHtml(d1)}</div>
        <div class="d2">${dk}</div>
      `;
      head.onclick = () => {
        setState({ currentYear: d.getFullYear(), currentMonth: d.getMonth(), selectedDate: dk }, { save: true, render: true });
        openDrawer(dk);
      };

      const body = document.createElement("div");
      body.className = "dayBody";

      const day = ensureDay(dk);
      const cds = (day.countdowns || []).slice(0, cdLimit);

      const previewTasks = [];
      walkTasks(day.tasks || [], (n) => {
        if (state.hideDone && n.done) return;
        if (previewTasks.length < taskLimit) previewTasks.push(`${n.done ? "✓" : "·"} ${n.text || (state.lang === "en" ? "Untitled" : "未命名")}`);
      });

      body.innerHTML = `
        <div class="wkCard">
          <div class="k">${escapeHtml(t("countdownLabel"))}</div>
          <div class="v">
            ${cds.length ? cds.map(cd => {
              const dt = dayDiffText(cd.targetDate);
              return `<div class="wkLine"><span class="tag">${cd.targetDate}</span> ${escapeHtml(cd.title || (state.lang === "en" ? "Untitled" : "未命名"))} <span class="tag">${escapeHtml(dt.text)}</span></div>`;
            }).join("") : `<div class="wkEmpty">${escapeHtml(t("none"))}</div>`}
          </div>
        </div>
        <div class="wkCard">
          <div class="k">${escapeHtml(t("taskLabel"))}</div>
          <div class="v">
            ${previewTasks.length ? previewTasks.map(s => `<div class="wkLine">${escapeHtml(s)}</div>`).join("") : `<div class="wkEmpty">${escapeHtml(t("none"))}</div>`}
          </div>
        </div>
      `;

      col.appendChild(head);
      col.appendChild(body);
      wrap.appendChild(col);
    }
  }

  // ===== 今日视图 =====
  function renderToday() {
    const showKey = todayKey();
    $("todayH2").textContent = formatHuman(showKey);

    const within = clampInt(state.settings?.todayCountdownWithinDays, 1, 3650, 10);

    const inp = $("todayCdWithinDays");
    if (inp) {
      if (document.activeElement !== inp) inp.value = String(within);

      const commit = () => {
        const n = clampInt(inp.value, 1, 3650, within);
        inp.value = String(n);
        if ((state.settings?.todayCountdownWithinDays ?? 10) === n) return;

        mutate(s => {
          s.settings = s.settings || {};
          s.settings.todayCountdownWithinDays = n;
        }, { save: true, render: true });
      };

      inp.onkeydown = (e) => {
        if (e.key === "Enter") { e.preventDefault(); inp.blur(); commit(); }
      };
      inp.onblur = commit;
    }

    const list = $("todayCountdownList");
    list.innerHTML = "";

    const cds = allCountdowns()
      .filter(cd => cd.sortDays >= 0 && cd.sortDays <= within)
      .sort((a, b) => a.sortDays - b.sortDays || (a.targetDate || "").localeCompare(b.targetDate || ""));

    if (!cds.length) {
      list.innerHTML = `<div class="mutedSmall">${escapeHtml(t("none"))}</div>`;
    } else {
      cds.forEach(cd => {
        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = `
          <div class="itemTop">
            <div class="itemName">${escapeHtml(cd.title || (state.lang === "en" ? "Untitled" : "未命名"))}</div>
            <div class="itemMeta">${cd.targetDate} · ${escapeHtml(cd.text)}</div>
          </div>
        `;
        div.style.cursor = "pointer";
        div.onclick = () => openDrawer(cd.dateKey);
        list.appendChild(div);
      });
    }

    const day = ensureDay(showKey);
    const preview = [];
    walkTasks(day.tasks || [], (n) => {
      if (state.hideDone && n.done) return;
      if (preview.length < 10) preview.push(`${n.done ? "✓" : "·"} ${n.text || (state.lang === "en" ? "Untitled" : "未命名")}`);
    });
    $("todayTasksPreview").innerHTML = preview.length
      ? preview.map(s => `<div>${escapeHtml(s)}</div>`).join("")
      : `<div>${escapeHtml(t("none"))}</div>`;

    $("btnOpenTodayDrawer").onclick = () => openDrawer(showKey);
  }

  // ===== 抽屉（日期详情） =====
  function openDrawer(dateKey) {
    const d = dateFromKey(dateKey);
    setState({ selectedDate: dateKey, currentYear: d.getFullYear(), currentMonth: d.getMonth() }, { save: true, render: false });
    $("drawerDateTitle").textContent = formatHuman(dateKey);
    $("drawerDateMeta").textContent = dateKey;
    $("drawerMask").classList.add("show");
    $("drawer").classList.add("show");
    $("drawer").setAttribute("aria-hidden", "false");
    renderDrawer();
  }
  function closeDrawer() {
    $("drawerMask").classList.remove("show");
    $("drawer").classList.remove("show");
    $("drawer").setAttribute("aria-hidden", "true");
  }

  // ===== 任务树辅助函数 =====
  function findNodeRef(nodes, id, parent = null) {
    for (let i = 0; i < (nodes || []).length; i++) {
      const n = nodes[i];
      if (n.id === id) return { parentArray: nodes, index: i, parentNode: parent };
      if (n.children?.length) {
        const r = findNodeRef(n.children, id, n);
        if (r) return r;
      }
    }
    return null;
  }
  function removeAt(arr, idx) {
    const out = arr.splice(idx, 1);
    return out[0] || null;
  }

  function renderTaskTree(container, nodes, prefixBase, { onStructureChange, onDoneChange }) {
    container.innerHTML = "";
    if (!(nodes || []).length) {
      container.innerHTML = `<div class="mutedSmall">${escapeHtml(t("none"))}</div>`;
      return;
    }

    const build = (node, pathArr, rootNodes) => {
      if (state.hideDone && node.done) return null;

      const idxText = `${prefixBase}-${pathArr.join(".")}`;
      const wrap = document.createElement("div");
      wrap.className = "node";

      const line = document.createElement("div");
      line.className = "nodeLine";
      line.innerHTML = `
        <span class="nodeIdx">${escapeHtml(idxText)}</span>
        <input class="nodeChk" type="checkbox" ${node.done ? "checked" : ""} />
        <input class="nodeTxt ${node.done ? "done" : ""}" data-task-id="${escapeAttr(node.id)}" type="text"
          value="${escapeAttr(node.text || "")}" placeholder="${escapeAttr(state.lang === "en" ? "Content..." : "内容…")}" />
        <div class="nodeActions">
          <button class="btn" ${addLocked() ? "disabled" : ""} title="${addLocked() ? escapeAttr(t("tipAdd")) : ""}">+ ${(state.lang === "en") ? "Sub" : "子任务"}</button>
          <button class="btn danger" ${delLocked() ? "disabled" : ""} title="${delLocked() ? escapeAttr(t("tipDel")) : ""}">${escapeHtml(t("delete"))}</button>
        </div>
      `;

      const chk = line.querySelector(".nodeChk");
      const txt = line.querySelector(".nodeTxt");
      const btnAdd = line.querySelectorAll("button")[0];
      const btnDel = line.querySelectorAll("button")[1];

      txt.oninput = () => { node.text = txt.value; saveSoon(); };

      chk.onchange = () => {
        node.done = chk.checked;
        saveState();
        if (state.hideDone) onDoneChange();
      };

      btnAdd.onclick = () => {
        if (addLocked()) { toast(t("tipAdd")); return; }
        node.children = node.children || [];
        node.children.push({ id: uid(), text: "", done: false, children: [] });
        saveState();
        onStructureChange();
      };

      btnDel.onclick = async () => {
        if (delLocked()) { toast(t("tipDel")); return; }
        const ok = await confirmDialog({
          title: t("delete"),
          desc: state.lang === "en" ? "Delete this task and its subtasks?" : "确认删除该任务及其子任务？",
          confirmText: t("delete"),
          danger: true
        });
        if (!ok) return;

        const ref = findNodeRef(rootNodes, node.id, null);
        if (!ref) return;
        ref.parentArray.splice(ref.index, 1);
        saveState();
        onStructureChange();
      };

      wrap.appendChild(line);

      if (node.children?.length) {
        const ch = document.createElement("div");
        ch.className = "nodeChildren";
        node.children.forEach((c, idx) => {
          const el = build(c, [...pathArr, idx + 1], rootNodes);
          if (el) ch.appendChild(el);
        });
        if (ch.childElementCount) wrap.appendChild(ch);
      }
      return wrap;
    };

    const root = document.createElement("div");
    root.className = "tree";
    nodes.forEach((t0, idx) => {
      const el = build(t0, [idx + 1], nodes);
      if (el) root.appendChild(el);
    });

    if (!root.childElementCount) root.innerHTML = `<div class="mutedSmall">${escapeHtml(t("none"))}</div>`;
    container.appendChild(root);
  }

  function bindOutlineKeys(container, nodes, onChange) {
    container.querySelectorAll('input.nodeTxt[data-task-id]').forEach(input => {
      input.onkeydown = (e) => {
        const id = input.getAttribute("data-task-id");
        if (!id) return;

        if (e.key === "Enter") {
          e.preventDefault();
          if (addLocked()) { toast(t("tipAdd")); return; }

          const ref = findNodeRef(nodes, id, null);
          if (!ref) return;

          const newNode = { id: uid(), text: "", done: false, children: [] };
          ref.parentArray.splice(ref.index + 1, 0, newNode);

          saveState();
          onChange();

          setTimeout(() => {
            const el = container.querySelector(`input.nodeTxt[data-task-id="${newNode.id}"]`);
            if (el) el.focus();
          }, 0);
          return;
        }

        if (e.key === "Tab") {
          e.preventDefault();
          if (addLocked()) { toast(t("tipAdd")); return; }

          const ref = findNodeRef(nodes, id, null);
          if (!ref) return;

          const parentArray = ref.parentArray;
          const index = ref.index;

          if (e.shiftKey) {
            const parentNode = ref.parentNode;
            if (!parentNode) return;

            const parentRef = findNodeRef(nodes, parentNode.id, null);
            if (!parentRef) return;

            const moved = removeAt(parentArray, index);
            if (!moved) return;

            parentRef.parentArray.splice(parentRef.index + 1, 0, moved);

            saveState();
            onChange();
            setTimeout(() => container.querySelector(`input.nodeTxt[data-task-id="${id}"]`)?.focus(), 0);
            return;
          }

          if (index <= 0) return;
          const prev = parentArray[index - 1];
          if (!prev) return;

          const moved = removeAt(parentArray, index);
          if (!moved) return;

          prev.children = prev.children || [];
          prev.children.push(moved);

          saveState();
          onChange();
          setTimeout(() => container.querySelector(`input.nodeTxt[data-task-id="${id}"]`)?.focus(), 0);
          return;
        }
      };
    });
  }

  function renderDrawer() {
    const dateKey = state.selectedDate;
    const day = ensureDay(dateKey);

    $("btnClearCountdowns").disabled = delLocked();
    $("btnClearTasks").disabled = delLocked();
    $("btnAddCountdown").disabled = addLocked();
    $("btnAddRootTask").disabled = addLocked();

    const list = $("countdownList");
    list.innerHTML = "";

    if (!(day.countdowns || []).length) {
      list.innerHTML = `<div class="mutedSmall">${escapeHtml(t("none"))}</div>`;
    } else {
      day.countdowns.forEach(cd => {
        const dt = dayDiffText(cd.targetDate);
        const item = document.createElement("div");
        item.className = "item";
        item.innerHTML = `
          <div class="itemTop">
            <div class="itemName">${escapeHtml(cd.title || (state.lang === "en" ? "Untitled" : "未命名"))}</div>
            <div class="row">
              <div class="itemMeta">${cd.targetDate} · ${escapeHtml(dt.text)}</div>
              <button class="btn danger" ${delLocked() ? "disabled" : ""} title="${delLocked() ? escapeAttr(t("tipDel")) : ""}">${escapeHtml(t("delete"))}</button>
            </div>
          </div>
        `;
        item.querySelector("button").onclick = async () => {
          if (delLocked()) { toast(t("tipDel")); return; }
          const ok = await confirmDialog({
            title: t("delete"),
            desc: state.lang === "en" ? "Delete this countdown?" : "确认删除该倒计时？",
            confirmText: t("delete"),
            danger: true
          });
          if (!ok) return;
          day.countdowns = (day.countdowns || []).filter(x => x.id !== cd.id);
          saveState();
          renderAll();
          renderDrawer();
        };
        list.appendChild(item);
      });
    }

    $("btnClearCountdowns").onclick = async () => {
      if (delLocked()) { toast(t("tipDel")); return; }
      const ok = await confirmDialog({
        title: t("clear"),
        desc: state.lang === "en" ? "Clear all countdowns?" : "确认清空全部倒计时？",
        confirmText: t("clear"),
        danger: true
      });
      if (!ok) return;
      day.countdowns = [];
      saveState();
      renderAll();
      renderDrawer();
    };

    $("btnAddRootTask").onclick = () => {
      if (addLocked()) { toast(t("tipAdd")); return; }
      day.tasks = day.tasks || [];
      const newNode = { id: uid(), text: "", done: false, children: [] };
      day.tasks.push(newNode);
      saveState();
      renderAll();
      renderDrawer();
      setTimeout(() => $("taskTree").querySelector(`input.nodeTxt[data-task-id="${newNode.id}"]`)?.focus(), 0);
    };

    $("btnClearTasks").onclick = async () => {
      if (delLocked()) { toast(t("tipDel")); return; }
      const ok = await confirmDialog({
        title: t("clear"),
        desc: state.lang === "en" ? "Clear all tasks?" : "确认清空全部任务？",
        confirmText: t("clear"),
        danger: true
      });
      if (!ok) return;
      day.tasks = [];
      saveState();
      renderAll();
      renderDrawer();
    };

    const prefix = ymdCompact(dateKey);
    renderTaskTree($("taskTree"), day.tasks, prefix, {
      onStructureChange: () => { renderAll(); renderDrawer(); },
      onDoneChange: () => { renderAll(); renderDrawer(); }
    });
    bindOutlineKeys($("taskTree"), day.tasks, () => { renderAll(); renderDrawer(); });

    // cdTarget：只在“切换到新的抽屉日期”时初始化；抽屉内部重渲染不要覆盖用户已选择的目标日期
    const targetEl = $("cdTarget");
    if (targetEl) {
      const seed = targetEl.dataset.seedDateKey;
      if (seed !== dateKey || !targetEl.value) {
        targetEl.value = dateKey;
        targetEl.dataset.seedDateKey = dateKey;
      }
    }

  }

  // ===== 顶部倒计时栏 =====
  function renderTopCountdownBar() {
    const top = $("cdTopList");
    top.innerHTML = "";
    const all = allCountdowns().filter(x => x.sortDays >= 0).slice(0, 3);

    if (!all.length) {
      top.innerHTML = `<div class="mutedSmall" style="padding:2px 0;">${escapeHtml(t("none"))}</div>`;
      return;
    }

    all.forEach(cd => {
      const chip = document.createElement("div");
      chip.className = "cdChip";
      chip.innerHTML = `
        <div style="min-width:0;">
          <div class="name">${escapeHtml(cd.title || (state.lang === "en" ? "Untitled" : "未命名"))}</div>
          <div class="meta">${cd.targetDate}</div>
        </div>
        <div class="badge">${escapeHtml(cd.text)}</div>
      `;
      chip.onclick = () => {
        const d = dateFromKey(cd.dateKey);
        setState({ currentYear: d.getFullYear(), currentMonth: d.getMonth(), selectedDate: cd.dateKey }, { save: true, render: true });
      };
      top.appendChild(chip);
    });
  }

  function openAllCountdownsModal() {
    const all = allCountdowns();
    const sortLabel = state.settings.countdownSort === "near" ? t("cdSortNear") : t("cdSortDate");

    const body = `
      <div class="row" style="justify-content:space-between;gap:10px;">
        <div class="mutedSmall">${escapeHtml(t("cdSort"))}：${escapeHtml(sortLabel)}</div>
        <button id="btnToggleCdSort" class="btn">${escapeHtml(state.lang === "en" ? "Toggle" : "切换")}</button>
      </div>
      <div class="list" style="margin-top:10px;max-height:54vh;overflow:auto;">
        ${all.length ? all.map(cd => `
          <div class="item" data-jump="${cd.dateKey}">
            <div class="itemTop">
              <div class="itemName">${escapeHtml(cd.title || (state.lang === "en" ? "Untitled" : "未命名"))}</div>
              <div class="itemMeta">${cd.targetDate} · ${escapeHtml(cd.text)}</div>
            </div>
          </div>
        `).join("") : `<div class="mutedSmall">${escapeHtml(t("none"))}</div>`}
      </div>
    `;

    openModal({ title: t("countdownLabel"), desc: "", bodyHTML: body, actions: [], onClose: null });

    $("btnToggleCdSort").onclick = () => {
      mutate(s => {
        s.settings.countdownSort = (s.settings.countdownSort === "near") ? "date" : "near";
      }, { save: true, render: false });
      openAllCountdownsModal();
    };

    $("modalBody").querySelectorAll("[data-jump]").forEach(el => {
      el.style.cursor = "pointer";
      el.onclick = () => {
        const dk = el.dataset.jump;
        const d = dateFromKey(dk);
        setState({ currentYear: d.getFullYear(), currentMonth: d.getMonth(), selectedDate: dk }, { save: true, render: true });
        closeModal();
      };
    });
  }

  // ===== 搜索 =====
  function searchMatches(q) {
    q = (q || "").trim().toLowerCase();
    if (!q) return [];
    const hits = [];

    for (const [dateKey, day] of Object.entries(state.byDate)) {
      const snippets = [];
      (day.countdowns || []).forEach(cd => {
        const tt = (cd.title || "").toLowerCase();
        if (tt.includes(q)) snippets.push(`${t("countdownLabel")}: ${cd.title || (state.lang === "en" ? "Untitled" : "未命名")}`);
      });
      walkTasks(day.tasks || [], (n) => {
        const tt = (n.text || "").toLowerCase();
        if (tt.includes(q)) snippets.push(`${t("taskLabel")}: ${n.text || (state.lang === "en" ? "Untitled" : "未命名")}`);
      });
      if (snippets.length) hits.push({ dateKey, snippet: snippets[0] });
    }

    hits.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    return hits.slice(0, 40);
  }

  function renderSearchDropdown(q) {
    const box = $("searchResults");
    const hits = searchMatches(q);

    if (!q.trim()) {
      box.classList.remove("show");
      box.innerHTML = "";
      return;
    }
    if (!hits.length) {
      box.innerHTML = `<div class="srEmpty">${escapeHtml(t("noResult"))}</div>`;
      box.classList.add("show");
      return;
    }

    box.innerHTML = hits.map(h => `
      <div class="srItem" data-date="${h.dateKey}">
        <div class="srTop">
          <div class="srTitle">${escapeHtml(formatHuman(h.dateKey))}</div>
          <div class="srDate">${h.dateKey}</div>
        </div>
        <div class="srHint">${escapeHtml(h.snippet)}</div>
      </div>
    `).join("");

    box.classList.add("show");
    box.querySelectorAll(".srItem").forEach(el => {
      el.onclick = () => {
        const dk = el.dataset.date;
        const d = dateFromKey(dk);
        setState({ currentYear: d.getFullYear(), currentMonth: d.getMonth(), selectedDate: dk }, { save: true, render: true });
        box.classList.remove("show");
      };
    });
  }

  // ===== 范围与代办栏（Lanes） =====
  function unique(arr) {
    const seen = new Set(); const out = [];
    for (const x of arr) {
      const k = (x || "").trim();
      if (!k) continue;
      if (seen.has(k)) continue;
      seen.add(k); out.push(k);
    }
    return out;
  }

  function renderScopeSelect() {
    const sel = $("laneScope");
    sel.innerHTML = "";

    const preset = unique(state.scopeOptions || ["本周", "本月", "本年"]);
    const custom = unique(state.customScopes || []);

    [...preset, ...custom].forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = scopeDisplay(name) || name;
      sel.appendChild(opt);
    });

    const optAdd = document.createElement("option");
    optAdd.value = "__add_custom__";
    optAdd.textContent = (state.lang === "en") ? "Add custom..." : "新增自定义…";
    sel.appendChild(optAdd);

    if (!sel.value) sel.value = preset[0] || custom[0] || "__add_custom__";
  }

  function promptAddCustomScope() {
    return new Promise((resolve) => {
      openModal({
        title: (state.lang === "en") ? "Add custom scope" : "新增自定义范围",
        desc: "",
        bodyHTML: `
          <div class="row">
            <div class="field" style="flex:1 1 360px;">
              <span class="kbd">${escapeHtml(state.lang === "en" ? "Name" : "名称")}</span>
              <input id="customScopeName" type="text" placeholder="${escapeAttr(state.lang === "en" ? "Enter name" : "请输入名称")}" />
            </div>
          </div>
        `,
        actions: [{
          text: t("create"),
          className: "primary",
          isDefault: true,
          onClick: () => {
            const v = ($("customScopeName")?.value || "").trim();
            resolve(v || null);
          }
        }],
        onClose: () => resolve(null)
      });
      setTimeout(() => $("customScopeName")?.focus(), 0);
    });
  }

  function openManageScopesModal() {
    const list = unique([...(state.scopeOptions || []), ...(state.customScopes || [])]);

    const listHTML = list.length ? list.map(name => `
      <div class="item" style="flex-direction:row;align-items:center;justify-content:space-between;">
        <div style="font-weight:800;">${escapeHtml(scopeDisplay(name) || name)}</div>
        <button class="btn danger" data-name="${escapeAttr(name)}" ${delLocked() ? "disabled" : ""} title="${delLocked() ? escapeAttr(t("tipDel")) : ""}">${escapeHtml(t("delete"))}</button>
      </div>
    `).join("") : `<div class="mutedSmall">${escapeHtml(t("none"))}</div>`;

    openModal({
      title: (state.lang === "en") ? "Manage scopes" : "管理范围",
      desc: "",
      bodyHTML: `
        <div class="section" style="padding:10px;">
          <div class="secHead" style="margin-bottom:8px;">
            <div class="h">${escapeHtml(state.lang === "en" ? "Scopes" : "范围列表")}</div>
            <button id="btnAddScope2" class="btn primary" ${addLocked() ? "disabled" : ""} title="${addLocked() ? escapeAttr(t("tipAdd")) : ""}">
              ${(state.lang === "en") ? "Add" : "新增自定义"}
            </button>
          </div>
          <div class="hr"></div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${listHTML}
          </div>
        </div>
      `,
      actions: [],
      onClose: null
    });

    $("btnAddScope2").onclick = async () => {
      if (addLocked()) { toast(t("tipAdd")); return; }
      const name = await promptAddCustomScope();
      if (!name) return;
      mutate(s => {
        s.customScopes = unique([...(s.customScopes || []), name]);
      }, { save: true, render: false });
      renderScopeSelect();
      closeModal();
      toast(t("saved"));
    };

    $("modalBody").querySelectorAll("button[data-name]").forEach(btn => {
      btn.onclick = async () => {
        if (delLocked()) { toast(t("tipDel")); return; }
        const name = btn.getAttribute("data-name");
        const displayName = scopeDisplay(name) || name;
        const ok = await confirmDialog({
          title: (state.lang === "en") ? "Delete scope" : "删除范围",
          desc: (state.lang === "en") ? `Delete "${displayName}" and all lanes under it?` : `确认删除「${displayName}」？同时会删除该范围下的代办栏。`,
          confirmText: t("delete"),
          danger: true
        });
        if (!ok) return;

        mutate(s => {
          s.scopeOptions = unique((s.scopeOptions || []).filter(x => x !== name));
          s.customScopes = unique((s.customScopes || []).filter(x => x !== name));
          s.lanes = (s.lanes || []).filter(l => (l.scope || "") !== name);
          if (s.activeLaneId && !(s.lanes || []).some(l => l.id === s.activeLaneId)) {
            s.activeLaneId = s.lanes.length ? s.lanes[0].id : null;
          }
        }, { save: true, render: true });

        renderScopeSelect();
        closeModal();
        toast(t("saved"));
      };
    });
  }

  function getActiveLane() {
    return state.lanes.find(x => x.id === state.activeLaneId) || null;
  }

  async function deleteLaneById(laneId) {
    if (delLocked()) { toast(t("tipDel")); return; }
    const lane = state.lanes.find(x => x.id === laneId);
    if (!lane) return;

    const rawName = lane?.label || lane?.scope || (state.lang === "en" ? "Lane" : "代办栏");
    const name = scopeDisplay(rawName) || rawName;
    const ok = await confirmDialog({
      title: (state.lang === "en") ? "Delete lane" : "删除代办栏",
      desc: (state.lang === "en") ? `Delete "${name}" and its tasks?` : `确认删除「${name}」及其任务？`,
      confirmText: t("delete"),
      danger: true
    });
    if (!ok) return;

    mutate(s => {
      s.lanes = (s.lanes || []).filter(x => x.id !== laneId);
      if (s.activeLaneId === laneId) {
        s.activeLaneId = s.lanes.length ? s.lanes[0].id : null;
      }
    }, { save: true, render: true });
  }

  function renderLaneTabs() {
    const tabs = $("laneTabs");
    tabs.innerHTML = "";
    if (!state.lanes?.length) return;

    (state.lanes || []).forEach(l => {
      const tab = document.createElement("div");
      tab.className = "tab" + (l.id === state.activeLaneId ? " active" : "");
      tab.onclick = () => setState({ activeLaneId: l.id }, { save: true, render: true });

      const label = document.createElement("span");
      const raw = l.label || l.scope || (state.lang === "en" ? "Lane" : "代办栏");
      label.textContent = scopeDisplay(raw) || raw;
      tab.appendChild(label);

      const x = document.createElement("span");
      x.className = "x";
      x.textContent = "×";
      x.title = delLocked() ? t("tipDel") : t("delete");
      if (delLocked()) x.style.opacity = ".45";
      x.onclick = (e) => { e.stopPropagation(); deleteLaneById(l.id); };

      tab.appendChild(x);
      tabs.appendChild(tab);
    });
  }

  function renderLanes() {
    renderLaneTabs();
    const body = $("laneBody");
    body.innerHTML = "";

    if (!state.lanes?.length) {
      const box = document.createElement("div");
      box.className = "section";
      box.innerHTML = `<div class="mutedSmall">${escapeHtml(state.lang === "en" ? "No lanes" : "无代办栏")}</div>`;
      body.appendChild(box);
      return;
    }

    if (!state.activeLaneId) state.activeLaneId = state.lanes[0].id;
    const lane = getActiveLane();
    if (!lane) { state.activeLaneId = state.lanes[0]?.id || null; return renderLanes(); }

    const box = document.createElement("div");
    box.className = "section";
    const rawLaneName = lane.label || lane.scope || (state.lang === "en" ? "Lane" : "代办栏");
    const laneName = scopeDisplay(rawLaneName) || rawLaneName;
    box.innerHTML = `
      <div class="secHead">
        <div class="h">${escapeHtml(laneName)}</div>
        <div class="row">
          <button id="laneAddRoot" class="btn primary" ${addLocked() ? "disabled" : ""} title="${addLocked() ? escapeAttr(t("tipAdd")) : ""}">${escapeHtml(t("newTask"))}</button>
          <button id="laneClear" class="btn danger" ${delLocked() ? "disabled" : ""} title="${delLocked() ? escapeAttr(t("tipDel")) : ""}">${escapeHtml(t("clear"))}</button>
          <button id="laneDelete" class="btn danger" ${delLocked() ? "disabled" : ""} title="${delLocked() ? escapeAttr(t("tipDel")) : ""}">${escapeHtml(state.lang === "en" ? "Delete lane" : "删除代办栏")}</button>
        </div>
      </div>
      <div class="hr"></div>
      <div id="laneTree" class="tree"></div>
    `;
    body.appendChild(box);

    const laneTree = box.querySelector("#laneTree");

    box.querySelector("#laneAddRoot").onclick = () => {
      if (addLocked()) { toast(t("tipAdd")); return; }
      mutate(s => {
        const L0 = s.lanes.find(x => x.id === lane.id);
        if (!L0) return;
        L0.tasks = L0.tasks || [];
        L0.tasks.push({ id: uid(), text: "", done: false, children: [] });
      }, { save: true, render: true });
      setTimeout(() => laneTree.querySelector(`input.nodeTxt[data-task-id]`)?.focus(), 0);
    };

    box.querySelector("#laneClear").onclick = async () => {
      if (delLocked()) { toast(t("tipDel")); return; }
      const ok = await confirmDialog({
        title: t("clear"),
        desc: (state.lang === "en") ? "Clear this lane?" : "确认清空该代办栏？",
        confirmText: t("clear"),
        danger: true
      });
      if (!ok) return;
      mutate(s => {
        const L0 = s.lanes.find(x => x.id === lane.id);
        if (L0) L0.tasks = [];
      }, { save: true, render: true });
    };

    box.querySelector("#laneDelete").onclick = () => deleteLaneById(lane.id);

    const prefix = `LANE-${(lane.label || lane.scope || "X").slice(0, 6)}`;
    renderTaskTree(laneTree, lane.tasks || [], prefix, {
      onStructureChange: () => renderAll(),
      onDoneChange: () => renderAll()
    });
    bindOutlineKeys(laneTree, lane.tasks || [], () => renderAll());
  }

  // ===== 设置 =====
  function openSettings() {
    const s = state.settings || {};

    openModal({
      title: t("settingsTitle"),
      desc: "",
      bodyHTML: `
        <div class="section" style="padding:10px;">
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div class="row">
              <div class="field" style="flex:1 1 220px;">
                <span class="kbd">${escapeHtml(t("wkCdLimit"))}</span>
                <input id="setCdLimit" type="text" value="${escapeAttr(String(s.previewCountdownLimit ?? 4))}" />
              </div>
              <div class="field" style="flex:1 1 220px;">
                <span class="kbd">${escapeHtml(t("wkTaskLimit"))}</span>
                <input id="setTaskLimit" type="text" value="${escapeAttr(String(s.previewTaskLimit ?? 6))}" />
              </div>
            </div>

            <div class="row">
              <div class="field" style="flex:1 1 220px;">
                <span class="kbd">${escapeHtml(t("cdSort"))}</span>
                <select id="setCdSort">
                  <option value="near" ${s.countdownSort === "near" ? "selected" : ""}>${escapeHtml(t("cdSortNear"))}</option>
                  <option value="date" ${s.countdownSort === "date" ? "selected" : ""}>${escapeHtml(t("cdSortDate"))}</option>
                </select>
              </div>

              <div class="field" style="flex:1 1 220px;">
                <span class="kbd">${escapeHtml(t("language"))}</span>
                <select id="setLang">
                  <option value="zh" ${state.lang === "zh" ? "selected" : ""}>中文</option>
                  <option value="en" ${state.lang === "en" ? "selected" : ""}>English</option>
                </select>
              </div>
            </div>

            <div class="mutedSmall">${escapeHtml(t("shortcuts"))}</div>
            <div class="mutedSmall">App: ${escapeHtml(APP_VERSION)} · Schema: ${STATE_SCHEMA_VERSION}</div>
          </div>
        </div>
      `,
      actions: [{
        text: t("save"),
        className: "primary",
        isDefault: true,
        onClick: () => {
          const cdLimit = clampInt($("setCdLimit")?.value, 1, 12, 4);
          const taskLimit = clampInt($("setTaskLimit")?.value, 1, 20, 6);
          const sort = ($("setCdSort")?.value === "date") ? "date" : "near";
          const lang = ($("setLang")?.value === "en") ? "en" : "zh";

          mutate(st => {
            st.settings.previewCountdownLimit = cdLimit;
            st.settings.previewTaskLimit = taskLimit;
            st.settings.countdownSort = sort;
            st.lang = lang;
          }, { save: true, render: true });

          applyI18n();
          toast(t("saved"));
        }
      }],
      onClose: null
    });
  }

  // ===== 备份与迁移（单一 BACKUP_KEY） =====
  function loadBackups() {
    try {
      const raw = localStorage.getItem(BACKUP_KEY);
      if (!raw) return [];
      const parsed = tryParseJson(raw);
      if (!parsed || !looksLikeBackups(parsed)) return [];

      return parsed
        .filter(b => b && typeof b === "object" && b.id && b.createdAt && b.data)
        .map(b => ({
          id: b.id,
          createdAt: b.createdAt,
          name: b.name || "",
          data: b.data
        }))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch {
      return [];
    }
  }

  function saveBackups(arr) {
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(arr));
    } catch {
      toast(t("saveFailed"));
    }
  }

  function snapshotState() {
    return JSON.parse(JSON.stringify(state));
  }

  function formatBackupTimeLocal(iso) {
    try {
      const d = new Date(iso);
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
    } catch {
      return iso;
    }
  }

  function defaultBackupName(lang = state.lang) {
    const d = new Date();
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    const da = d.getDate();
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    const ss = pad2(d.getSeconds());

    if (lang === "en") return `Backup ${y}-${pad2(mo)}-${pad2(da)} ${hh}:${mm}:${ss}`;
    return `${y}年${mo}月${da}日${hh}:${mm}:${ss}备份`;
  }

  function promptBackupName() {
    return new Promise((resolve) => {
      openModal({
        title: t("backupNameTitle"),
        desc: t("backupNameDesc"),
        bodyHTML: `
          <div class="row">
            <div class="field" style="flex:1 1 420px;">
              <span class="kbd">${escapeHtml(t("save"))}</span>
              <input id="backupNameInput" type="text" placeholder="${escapeAttr(t("backupNamePH"))}" />
            </div>
          </div>
          <div class="mutedSmall" style="margin-top:8px;">
            ${escapeHtml(state.lang === "en" ? "Enter = confirm" : "回车 = 确认")}
          </div>
        `,
        actions: [{
          text: t("save"),
          className: "primary",
          isDefault: true,
          onClick: () => {
            const name = ($("backupNameInput")?.value || "").trim();
            resolve(name); // 空字符串=自动命名；关闭弹窗=取消
          }
        }],
        onClose: () => resolve(null)
      });
      setTimeout(() => $("backupNameInput")?.focus(), 0);
    });
  }

  async function saveBackupFlow() {
    if (addLocked()) { toast(t("tipAdd")); return; }

    const name = await promptBackupName();
    if (name === null) { toast(t("cancelled")); return; }

    const backups = loadBackups();
    backups.push({
      id: uid(),
      createdAt: new Date().toISOString(),
      name: name || defaultBackupName(),
      data: snapshotState()
    });
    saveBackups(backups);
    toast(t("backupSaved"));
    openBackupsModal();
  }

  async function deleteBackupById(bid) {
    if (delLocked()) { toast(t("tipDel")); return; }

    const backups = loadBackups();
    const b = backups.find(x => x.id === bid);
    if (!b) return;

    const desc = t("backupDeleteDesc", b.name || defaultBackupName(), formatBackupTimeLocal(b.createdAt));
    const ok = await inputGate({
      title: t("backupDeleteTitle"),
      desc,
      placeholder: (state.lang === "en") ? "Type DELETE" : "请输入 DELETE",
      expect: t("tokenDelete"),
      danger: true
    });
    if (!ok) { toast(t("cancelled")); return; }

    saveBackups(backups.filter(x => x.id !== bid));
    toast(t("backupDeleted"));
    openBackupsModal();
  }

  async function restoreBackupByIndex(idx) {
    if (addLocked() || delLocked()) {
      if (addLocked()) toast(t("tipAdd"));
      if (delLocked()) toast(t("tipDel"));
      return;
    }

    const backups = loadBackups();
    if (idx < 0 || idx >= backups.length) return;
    const b = backups[idx];

    const ok = await confirmDialog({
      title: t("backupRestoreTitle"),
      desc: t("backupRestoreDesc", b.name || defaultBackupName(), formatBackupTimeLocal(b.createdAt)),
      confirmText: t("restore"),
      danger: true
    });
    if (!ok) return;

    state = migrateState(b.data);
    if (!state.activeLaneId && state.lanes?.length) state.activeLaneId = state.lanes[0].id;

    const kept = backups.slice(0, idx + 1);
    saveBackups(kept);

    saveState();
    applyI18n();
    setSwitch($("protectDelSwitch"), state.protectDelete);
    setSwitch($("protectAddSwitch"), state.protectAdd);
    setSwitch($("hideDoneSwitch"), state.hideDone);

    renderAll();
    toast(t("backupRestored"));
    closeModal();
  }

  function downloadJson(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function exportDataPackage() {
    const d = new Date();
    const stamp = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
    const filename = `local-calendar-export-${stamp}.json`;

    const pkg = {
      format: "local-calendar-export",
      appVersion: APP_VERSION,
      stateSchemaVersion: STATE_SCHEMA_VERSION,
      backupSchemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      state: snapshotState(),
      backups: loadBackups()
    };

    downloadJson(filename, pkg);
    toast(t("exportDone"));
  }

  function parseImportPayload(obj) {
    // 1) 标准导出包
    if (isPlainObject(obj) && obj.format === "local-calendar-export") {
      const st = obj.state;
      const bks = obj.backups;
      const hasState = looksLikeState(st);
      const hasBackups = Array.isArray(bks) && looksLikeBackups(bks);
      if (hasState) return { state: st, backups: hasBackups ? bks : null };
      return null;
    }

    // 2) 仅 state
    if (looksLikeState(obj)) return { state: obj, backups: null };

    // 3) 仅 backups
    if (looksLikeBackups(obj)) return { state: null, backups: obj };

    return null;
  }

  async function importDataFlow() {
    if (addLocked() || delLocked()) {
      if (addLocked()) toast(t("tipAdd"));
      if (delLocked()) toast(t("tipDel"));
      return;
    }

    let picked = null;

    openModal({
      title: t("importTitle"),
      desc: t("importDesc"),
      bodyHTML: `
        <div class="section" style="padding:10px;">
          <div class="row" style="justify-content:space-between;gap:10px;">
            <button id="btnPickImportFile" class="btn primary">${escapeHtml(t("importPickFile"))}</button>
            <input id="importFileInput" type="file" accept="application/json" style="display:none;" />
          </div>

          <div class="hr"></div>

          <div class="mutedSmall" style="margin-bottom:6px;">${escapeHtml(t("importPaste"))}</div>
          <textarea id="importTextArea" rows="8" style="width:100%;resize:vertical;padding:10px;border-radius:12px;border:1px solid var(--line);background:color-mix(in srgb, var(--panel) 85%, transparent);color:var(--text);outline:none;"
            placeholder="${escapeAttr(t("importPH"))}"></textarea>
        </div>
      `,
      actions: [
        {
          text: t("importDo"),
          className: "primary",
          isDefault: true,
          onClick: async () => {
            // 优先 textarea，其次 file
            const text = ($("importTextArea")?.value || "").trim();
            let obj = null;

            if (text) {
              obj = tryParseJson(text);
            } else if (picked) {
              obj = picked;
            }

            const payload = obj ? parseImportPayload(obj) : null;
            if (!payload) {
              toast(t("importInvalid"));
              return false;
            }

            const ok = await confirmDialog({
              title: t("importConfirmTitle"),
              desc: t("importConfirmDesc"),
              confirmText: t("importDo"),
              danger: true
            });
            if (!ok) return false;

            // 覆盖 state
            if (payload.state) {
              state = migrateState(payload.state);
              if (!state.activeLaneId && state.lanes?.length) state.activeLaneId = state.lanes[0].id;
              saveState();
            }
            // 可选覆盖 backups（若导出包包含）
            if (payload.backups) {
              saveBackups(payload.backups);
            }

            applyI18n();
            setSwitch($("protectDelSwitch"), state.protectDelete);
            setSwitch($("protectAddSwitch"), state.protectAdd);
            setSwitch($("hideDoneSwitch"), state.hideDone);

            renderAll();
            toast(t("importSuccess"));
          }
        },
        { text: t("close"), className: "", isDefault: false }
      ],
      onClose: null
    });

    const pickBtn = $("btnPickImportFile");
    const input = $("importFileInput");

    pickBtn.onclick = () => input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const txt = await file.text();
        const obj = tryParseJson(txt);
        if (!obj) {
          toast(t("importInvalid"));
          return;
        }
        picked = obj;
        toast(t("saved"));
      } catch {
        toast(t("importInvalid"));
      }
    };
  }

  function openBackupsModal() {
    const backups = loadBackups();
    const canSave = !addLocked();
    const canDel = !delLocked();

    const listHTML = backups.length ? backups.map((b, i) => `
      <div class="item" style="flex-direction:row;align-items:center;justify-content:space-between;gap:10px;">
        <div style="min-width:0;">
          <div style="font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:320px;">
            ${escapeHtml(b.name || defaultBackupName())}
          </div>
          <div class="itemMeta">${escapeHtml(formatBackupTimeLocal(b.createdAt))}</div>
        </div>
        <div class="row" style="justify-content:flex-end;">
          <button class="btn primary" data-restore="${i}" ${(!canSave || !canDel) ? "disabled" : ""} title="${addLocked() ? escapeAttr(t("tipAdd")) : (delLocked() ? escapeAttr(t("tipDel")) : "")}">
            ${escapeHtml(t("restore"))}
          </button>
          <button class="btn danger" data-del="${escapeAttr(b.id)}" ${canDel ? "" : "disabled"} title="${canDel ? "" : escapeAttr(t("tipDel"))}">
            ${escapeHtml(t("delete"))}
          </button>
        </div>
      </div>
    `).join("") : `<div class="mutedSmall">${escapeHtml(t("none"))}</div>`;

    openModal({
      title: t("backupsTitle"),
      desc: t("backupsDesc"),
      bodyHTML: `
        <div class="section" style="padding:10px;">
          <div class="secHead" style="margin-bottom:8px;">
            <div class="h">${escapeHtml(t("backupList"))}</div>
            <div class="row">
              <button id="btnExportData" class="btn">${escapeHtml(t("backupExport"))}</button>
              <button id="btnImportData" class="btn">${escapeHtml(t("backupImport"))}</button>
              <button id="btnSaveBackup" class="btn primary" ${canSave ? "" : "disabled"} title="${canSave ? "" : escapeAttr(t("tipAdd"))}">
                ${escapeHtml(t("backupSave"))}
              </button>
            </div>
          </div>
          <div class="hr"></div>
          <div style="display:flex;flex-direction:column;gap:10px;max-height:56vh;overflow:auto;">
            ${listHTML}
          </div>
        </div>
      `,
      actions: [],
      onClose: null
    });

    $("btnSaveBackup").onclick = saveBackupFlow;
    $("btnExportData").onclick = exportDataPackage;
    $("btnImportData").onclick = importDataFlow;

    $("modalBody").querySelectorAll("button[data-del]").forEach(btn => {
      btn.onclick = () => deleteBackupById(btn.getAttribute("data-del"));
    });
    $("modalBody").querySelectorAll("button[data-restore]").forEach(btn => {
      const i = Number(btn.getAttribute("data-restore"));
      btn.onclick = () => restoreBackupByIndex(i);
    });
  }

  // ===== 出厂设置 =====
  async function factoryReset() {
    if (addLocked() || delLocked()) {
      if (addLocked()) toast(t("tipAdd"));
      if (delLocked()) toast(t("tipDel"));
      return;
    }

    const ok1 = await inputGate({
      title: t("resetTitle"),
      desc: t("resetStep1"),
      placeholder: (state.lang === "en") ? "Type YES" : "请输入 YES",
      expect: t("tokenYes"),
      danger: true
    });
    if (!ok1) { toast(t("cancelled")); return; }

    const ok2 = await inputGate({
      title: t("resetTitle"),
      desc: t("resetStep2"),
      placeholder: (state.lang === "en") ? "Type RESET" : "请输入 RESET",
      expect: t("tokenReset"),
      danger: true
    });
    if (!ok2) { toast(t("cancelled")); return; }

    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_KEY);
    } catch { /* ignore */ }

    state = defaultState();
    if (!state.activeLaneId && state.lanes?.length) state.activeLaneId = state.lanes[0].id;
    saveState();

    applyI18n();
    setSwitch($("protectDelSwitch"), state.protectDelete);
    setSwitch($("protectAddSwitch"), state.protectAdd);
    setSwitch($("hideDoneSwitch"), state.hideDone);

    renderAll();
    toast(t("resetDone"));
  }

  // ===== 事件绑定 =====
  function toggleProtectDel() {
    setState({ protectDelete: !state.protectDelete }, { save: true, render: true });
    setSwitch($("protectDelSwitch"), state.protectDelete);
  }
  function toggleProtectAdd() {
    setState({ protectAdd: !state.protectAdd }, { save: true, render: true });
    setSwitch($("protectAddSwitch"), state.protectAdd);
  }
  function toggleHideDone() {
    setState({ hideDone: !state.hideDone }, { save: true, render: true });
    setSwitch($("hideDoneSwitch"), state.hideDone);
  }

  function wire() {
    renderMonthSelect();
    renderScopeSelect();

    bindYearInput();
    bindMonthSelect();
    bindThemeButton();
    bindProtectAndHideSwitches();
    bindViewButtons();
    bindTodayJump();
    bindDrawerBasics();
    bindTopCountdownBar();
    bindSearchBox();
    bindScopesAndSettings();
    bindAddLane();
    bindAddCountdown();
    bindBackupsAndReset();
    bindGlobalShortcuts();

    // 绑定新手提示
    bindHelpAll();
    window.addEventListener("resize", () => {
      if (hintCtx.lastTarget) showHintFor(hintCtx.lastTarget);
    });

    // ===== 绑定函数（仅在 wire 内部使用） =====

    function bindYearInput() {
      // 年份输入（无限年份：1~9999）
      const yearInput = $("yearInput");
      const commitYear = () => {
        const y = clampInt(yearInput?.value, 1, 9999, state.currentYear);
        if (!yearInput) return;
        yearInput.value = String(y);

        if (y === state.currentYear) return;
        const dk = `${String(y).padStart(4, "0")}-${pad2(state.currentMonth + 1)}-01`;
        setState({ currentYear: y, selectedDate: dk }, { save: true, render: true });
      };
      if (yearInput) {
        yearInput.value = String(state.currentYear);
        yearInput.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); yearInput.blur(); commitYear(); } };
        yearInput.onblur = commitYear;
      }
    }

    function bindMonthSelect() {
      // 月份切换：同时把 selectedDate 定位到该月 01 日
      $("monthSelect").onchange = (e) => {
        const m = clampInt(e.target.value, 0, 11, state.currentMonth);
        const dk = `${String(state.currentYear).padStart(4, "0")}-${pad2(m + 1)}-01`;
        setState({ currentMonth: m, selectedDate: dk }, { save: true, render: true });
      };
    }

    function bindThemeButton() {
      $("themeBtn").onclick = cycleTheme;
    }

    function bindSwitchKey(el, fn) {
      el.onclick = fn;
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
      });
    }

    function bindProtectAndHideSwitches() {
      bindSwitchKey($("protectDelSwitch"), toggleProtectDel);
      bindSwitchKey($("protectAddSwitch"), toggleProtectAdd);
      bindSwitchKey($("hideDoneSwitch"), toggleHideDone);
    }

    function bindViewButtons() {
      $("viewMonth").onclick = () => setView("month");
      $("viewWeek").onclick = () => setView("week");
      $("viewToday").onclick = () => setView("today");
    }

    function bindTodayJump() {
      $("btnTodayJump").onclick = () => {
        const dk = todayKey();
        const d = dateFromKey(dk);
        setState({ currentYear: d.getFullYear(), currentMonth: d.getMonth(), selectedDate: dk }, { save: true, render: true });
      };
    }

    function bindDrawerBasics() {
      $("drawerMask").onclick = closeDrawer;
      $("btnCloseDrawer").onclick = closeDrawer;
    }

    function bindTopCountdownBar() {
      $("btnAllCountdowns").onclick = openAllCountdownsModal;
    }

    function bindSearchBox() {
      $("searchInput").oninput = (e) => renderSearchDropdown(e.target.value);
      document.addEventListener("click", (e) => {
        const box = $("searchResults");
        const wrap = box.parentElement;
        if (!wrap.contains(e.target)) box.classList.remove("show");
      });
    }

    function bindScopesAndSettings() {
      $("btnManageScopes").onclick = openManageScopesModal;
      $("btnSettings").onclick = openSettings;

      $("laneScope").onchange = async (e) => {
        if (e.target.value === "__add_custom__") {
          if (addLocked()) { toast(t("tipAdd")); renderScopeSelect(); return; }
          const name = await promptAddCustomScope();
          if (!name) { renderScopeSelect(); return; }
          mutate(s => { s.customScopes = unique([...(s.customScopes || []), name]); }, { save: true, render: false });
          renderScopeSelect();
          $("laneScope").value = name;
        }
      };
    }

    function bindAddLane() {
      $("btnAddLane").onclick = () => {
        if (addLocked()) { toast(t("tipAdd")); return; }
        const scope = $("laneScope").value;
        if (!scope || scope === "__add_custom__") { toast(state.lang === "en" ? "Select a scope" : "请选择范围"); return; }

        const existing = (state.lanes || []).find(l => (l.scope || "") === scope);
        if (existing) {
          setState({ activeLaneId: existing.id }, { save: true, render: true });
          return;
        }

        mutate(s => {
          const lane = { id: uid(), label: scope, scope, tasks: [] };
          s.lanes = s.lanes || [];
          s.lanes.push(lane);
          s.activeLaneId = lane.id;
        }, { save: true, render: true });
      };
    }

    function bindAddCountdown() {
      // 倒计时添加（Enter = 添加）
      const addCountdownAction = () => {
        if (addLocked()) { toast(t("tipAdd")); return; }
        const dateKey = state.selectedDate;

        const title = $("cdTitle").value.trim();
        const targetRaw = $("cdTarget").value;
        if (!targetRaw) { toast(state.lang === "en" ? "Select a target date" : "请选择目标日期"); return; }

        // 按目标日期入库（而不是按当前打开抽屉的日期入库）
        const targetKey = normalizeDateKey(targetRaw, dateKey);
        const day = ensureDay(targetKey);

        day.countdowns.push({
          id: uid(),
          title: title || (state.lang === "en" ? "Untitled" : "未命名"),
          targetDate: targetKey
        });

        $("cdTitle").value = "";
        saveState();
        renderAll();
        renderDrawer();

        // 当你在别的日期抽屉里添加了不同目标日的倒计时，提醒用户“存到哪里了”
        if (targetKey !== dateKey) {
          toast(state.lang === "en" ? `Added to ${targetKey}` : `已添加到 ${targetKey}`);
        }
      };

      $("btnAddCountdown").onclick = addCountdownAction;
      $("cdTitle").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addCountdownAction(); }});
      $("cdTarget").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addCountdownAction(); }});
    }

    function bindBackupsAndReset() {
      $("btnBackups").onclick = openBackupsModal;
      $("btnFactoryReset").onclick = factoryReset;
    }

    function bindGlobalShortcuts() {
      // 全局快捷键
      window.addEventListener("keydown", (e) => {
        const tag = (document.activeElement?.tagName || "").toLowerCase();
        const inInput = tag === "input" || tag === "textarea" || tag === "select";

        if (e.key === "Escape") {
          closeDrawer();
          closeModal();
          $("searchResults").classList.remove("show");
          hideHint({ force: true });
          return;
        }
        if (inInput) return;

        if (e.key === "/") { e.preventDefault(); $("searchInput").focus(); return; }
        if (e.key === "t" || e.key === "T") { e.preventDefault(); $("btnTodayJump").click(); return; }
        if (e.key === "m" || e.key === "M") { setView("month"); return; }
        if (e.key === "w" || e.key === "W") { setView("week"); return; }
        if (e.key === "d" || e.key === "D") { setView("today"); return; }
      });
    }
  }


  function renderAll() {
    applyI18n();
    renderView();
    renderMonthSelect();
    renderScopeSelect();
    renderTopCountdownBar();
    renderLanes();

    if (state.view === "month") renderMonthGrid();
    else if (state.view === "week") renderWeek();
    else renderToday();
  }

  function init() {
    initHint();

    // 首次运行：如果 key 没有，则写入一次默认状态
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        saveState();
      }
    } catch { /* ignore */ }

    applyI18n();
    setSwitch($("protectDelSwitch"), state.protectDelete);
    setSwitch($("protectAddSwitch"), state.protectAdd);
    setSwitch($("hideDoneSwitch"), state.hideDone);

    wire();
    renderAll();
  }

  init();
})();

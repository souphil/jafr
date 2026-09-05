var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var ALPHABET = [
  "\u0627",
  "\u0628",
  "\u062C",
  "\u062F",
  "\u0647",
  "\u0648",
  "\u0632",
  "\u062D",
  "\u0637",
  "\u06CC",
  "\u06A9",
  "\u0644",
  "\u0645",
  "\u0646",
  "\u0633",
  "\u0639",
  "\u0641",
  "\u0635",
  "\u0642",
  "\u0631",
  "\u0634",
  "\u062A",
  "\u062B",
  "\u062E",
  "\u0630",
  "\u0636",
  "\u0638",
  "\u063A"
];
var ABJAD_VALUES = {
  "\u0627": 1,
  "\u0628": 2,
  "\u062C": 3,
  "\u062F": 4,
  "\u0647": 5,
  "\u0648": 6,
  "\u0632": 7,
  "\u062D": 8,
  "\u0637": 9,
  "\u06CC": 10,
  "\u06A9": 20,
  "\u0644": 30,
  "\u0645": 40,
  "\u0646": 50,
  "\u0633": 60,
  "\u0639": 70,
  "\u0641": 80,
  "\u0635": 90,
  "\u0642": 100,
  "\u0631": 200,
  "\u0634": 300,
  "\u062A": 400,
  "\u062B": 500,
  "\u062E": 600,
  "\u0630": 700,
  "\u0636": 800,
  "\u0638": 900,
  "\u063A": 1e3
};
var LETTER_SPELLING = {
  "\u0627": "\u0627\u0644\u0641",
  "\u0628": "\u0628\u0627",
  "\u062C": "\u062C\u06CC\u0645",
  "\u062F": "\u062F\u0627\u0644",
  "\u0647": "\u0647\u0627",
  "\u0648": "\u0648\u0627\u0648",
  "\u0632": "\u0632\u0627",
  "\u062D": "\u062D\u0627",
  "\u0637": "\u0637\u0627",
  "\u06CC": "\u06CC\u0627",
  "\u06A9": "\u06A9\u0627\u0641",
  "\u0644": "\u0644\u0627\u0645",
  "\u0645": "\u0645\u06CC\u0645",
  "\u0646": "\u0646\u0648\u0646",
  "\u0633": "\u0633\u06CC\u0646",
  "\u0639": "\u0639\u06CC\u0646",
  "\u0641": "\u0641\u0627",
  "\u0635": "\u0635\u0627\u062F",
  "\u0642": "\u0642\u0627\u0641",
  "\u0631": "\u0631\u0627",
  "\u0634": "\u0634\u06CC\u0646",
  "\u062A": "\u062A\u0627",
  "\u062B": "\u062B\u0627",
  "\u062E": "\u062E\u0627",
  "\u0630": "\u0630\u0627\u0644",
  "\u0636": "\u0636\u0627\u062F",
  "\u0638": "\u0638\u0627",
  "\u063A": "\u063A\u06CC\u0646"
};
var LETTER_INDEX = new Map(ALPHABET.map((ch, i) => [ch, i]));
var NORMALIZE_MAP = {
  "\u0622": "\u0627",
  "\u0623": "\u0627",
  "\u0625": "\u0627",
  "\u0671": "\u0627",
  "\u0624": "\u0648",
  "\u0626": "\u06CC",
  "\u064A": "\u06CC",
  "\u0649": "\u06CC",
  "\u0629": "\u0647",
  "\u0643": "\u06A9",
  "\u0621": "\u0627"
};
function normalizeText(text) {
  const out = [];
  for (const raw of String(text || "")) {
    const ch = NORMALIZE_MAP[raw] || raw;
    if (LETTER_INDEX.has(ch)) out.push(ch);
  }
  return out;
}
__name(normalizeText, "normalizeText");
function clampLetterNumber(n) {
  const m = (n % 28 + 28) % 28;
  return m === 0 ? 28 : m;
}
__name(clampLetterNumber, "clampLetterNumber");
function letterAt(oneBasedIndex) {
  return ALPHABET[oneBasedIndex - 1];
}
__name(letterAt, "letterAt");
function getHouse(jozv, safhe, satr, khane) {
  return {
    jozv,
    safhe,
    satr,
    khane,
    letters: [letterAt(jozv), letterAt(safhe), letterAt(satr), letterAt(khane)]
  };
}
__name(getHouse, "getHouse");
function getPage(jozv, safhe) {
  const rows = [];
  for (let t = 1; t <= 28; t++) {
    const cells = [];
    for (let k = 1; k <= 28; k++) {
      cells.push(getHouse(jozv, safhe, t, k).letters.join(""));
    }
    rows.push(cells);
  }
  return { jozv, safhe, jozvLetter: letterAt(jozv), safheLetter: letterAt(safhe), rows };
}
__name(getPage, "getPage");
function computeAbjad(text) {
  const letters = normalizeText(text);
  const breakdown = letters.map((ch) => ({ letter: ch, value: ABJAD_VALUES[ch] }));
  const total = breakdown.reduce((s, b) => s + b.value, 0);
  let reduced = total;
  while (reduced > 9) {
    reduced = String(reduced).split("").reduce((s, d) => s + Number(d), 0);
  }
  return { letters, breakdown, total, raddeAhad: reduced };
}
__name(computeAbjad, "computeAbjad");
function estekhraj(question) {
  const malfuzi = normalizeText(question);
  const malbubi = [];
  for (const ch of malfuzi) {
    const spelling = normalizeText(LETTER_SPELLING[ch] || "");
    const idx = spelling.findIndex((c) => c === ch);
    const rest = idx === -1 ? spelling : spelling.slice(0, idx).concat(spelling.slice(idx + 1));
    malbubi.push(...rest.length ? rest : spelling);
  }
  const masruri = [...malfuzi].reverse();
  const combined = [];
  const maxLen = Math.max(malfuzi.length, malbubi.length, masruri.length);
  for (let i = 0; i < maxLen; i++) {
    if (malfuzi[i]) combined.push(malfuzi[i]);
    if (malbubi[i]) combined.push(malbubi[i]);
    if (masruri[i]) combined.push(masruri[i]);
  }
  const total = combined.reduce((s, ch) => s + (ABJAD_VALUES[ch] || 0), 0);
  const khane = clampLetterNumber(total);
  const satr = clampLetterNumber(Math.floor(total / 28));
  const safhe = clampLetterNumber(Math.floor(total / 28 / 28));
  const jozv = clampLetterNumber(Math.floor(total / 28 / 28 / 28));
  const house = getHouse(jozv, safhe, satr, khane);
  return {
    input: question,
    steps: {
      malfuzi: malfuzi.join(" "),
      malbubi: malbubi.join(" "),
      masruri: masruri.join(" "),
      combined: combined.join(" "),
      total
    },
    address: { jozv, safhe, satr, khane },
    house: house.letters.join(" "),
    houseCombined: house.letters.join("")
  };
}
__name(estekhraj, "estekhraj");
function malfuziExpand(word) {
  const letters = normalizeText(word);
  const out = [];
  for (const ch of letters) {
    const spelling = normalizeText(LETTER_SPELLING[ch] || ch);
    out.push(...spelling);
  }
  return out;
}
__name(malfuziExpand, "malfuziExpand");
function binat(malfuziLetters) {
  return malfuziLetters.slice(1);
}
__name(binat, "binat");
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
__name(json, "json");
function parseIntSafe(v, fallback) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}
__name(parseIntSafe, "parseIntSafe");
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/alphabet") {
      return json({ alphabet: ALPHABET, values: ABJAD_VALUES });
    }
    if (url.pathname === "/api/house") {
      const jozv = clampLetterNumber(parseIntSafe(url.searchParams.get("jozv"), 1));
      const safhe = clampLetterNumber(parseIntSafe(url.searchParams.get("safhe"), 1));
      const satr = clampLetterNumber(parseIntSafe(url.searchParams.get("satr"), 1));
      const khane = clampLetterNumber(parseIntSafe(url.searchParams.get("khane"), 1));
      return json(getHouse(jozv, safhe, satr, khane));
    }
    if (url.pathname === "/api/page") {
      const jozv = clampLetterNumber(parseIntSafe(url.searchParams.get("jozv"), 1));
      const safhe = clampLetterNumber(parseIntSafe(url.searchParams.get("safhe"), 1));
      return json(getPage(jozv, safhe));
    }
    if (url.pathname === "/api/locate") {
      const raw = url.searchParams.get("text") || "";
      const letters = normalizeText(raw);
      if (letters.length !== 4) {
        return json({ error: "\u062F\u0642\u06CC\u0642\u0627\u064B \u0628\u0627\u06CC\u062F \u06F4 \u062D\u0631\u0641 \u0645\u0639\u062A\u0628\u0631 \u0627\u0632 \u0627\u0644\u0641\u0628\u0627\u06CC \u062C\u0641\u0631 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F." }, 400);
      }
      const [j, s, t, k] = letters.map((ch) => LETTER_INDEX.get(ch) + 1);
      return json(getHouse(j, s, t, k));
    }
    if (url.pathname === "/api/abjad" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      return json(computeAbjad(body.text || ""));
    }
    if (url.pathname === "/api/estekhraj" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      if (!body.question || !normalizeText(body.question).length) {
        return json({ error: "\u0645\u062A\u0646 \u0633\u0624\u0627\u0644 \u06CC\u0627 \u0627\u0633\u0645 \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F." }, 400);
      }
      return json(estekhraj(body.question));
    }
    if (url.pathname === "/api/estekhraj2" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const text = body.text || "";
      if (!normalizeText(text).length) {
        return json({ error: "\u0645\u062A\u0646 \u0633\u0624\u0627\u0644 \u06CC\u0627 \u0627\u0633\u0645 \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F." }, 400);
      }
      const malfuzi = malfuziExpand(text);
      const bin = binat(malfuzi);
      const total = bin.reduce((s, ch) => s + (ABJAD_VALUES[ch] || 0), 0);
      let words = [];
      try {
        const idxRes = await env.ASSETS.fetch(new URL("/data/word-index.json", request.url));
        if (idxRes.ok) {
          const idx = await idxRes.json();
          words = idx[String(total)] || [];
        }
      } catch (e) {
      }
      return json({
        input: text,
        malfuzi: malfuzi.join(" "),
        binat: bin.join(" "),
        total,
        words
      });
    }
    if (url.pathname === "/api/word-for-number") {
      const number = parseIntSafe(url.searchParams.get("number"), null);
      if (!number) return json({ error: "\u0639\u062F\u062F \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A." }, 400);
      let words = [];
      try {
        const idxRes = await env.ASSETS.fetch(new URL("/data/word-index.json", request.url));
        if (idxRes.ok) {
          const idx = await idxRes.json();
          words = idx[String(number)] || [];
        }
      } catch (e) {
      }
      return json({ number, words });
    }
    return env.ASSETS.fetch(request);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-XFxlY0/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-XFxlY0/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  ABJAD_VALUES,
  ALPHABET,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  binat,
  computeAbjad,
  middleware_loader_entry_default as default,
  estekhraj,
  getHouse,
  getPage,
  malfuziExpand,
  normalizeText
};
//# sourceMappingURL=index.js.map

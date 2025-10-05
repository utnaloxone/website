var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// index.js
var getExtension = /* @__PURE__ */ __name((path) => {
  const basename = path.split("/").pop();
  const pos = basename.lastIndexOf(".");
  return basename === "" || pos < 1 ? "" : basename.slice(pos + 1);
}, "getExtension");
var isMediaRequest = /* @__PURE__ */ __name((url) => /\/media_[0-9a-f]{40,}[/a-zA-Z0-9_-]*\.[0-9a-z]+$/.test(url.pathname), "isMediaRequest");
var isRUMRequest = /* @__PURE__ */ __name((url) => /\/\.(rum|optel)\/.*/.test(url.pathname), "isRUMRequest");
var getDraft = /* @__PURE__ */ __name((url) => {
  if (!url.pathname.startsWith("/drafts/")) return null;
  return new Response("Not Found", { status: 404 });
}, "getDraft");
var getPortRedirect = /* @__PURE__ */ __name((request, url) => {
  if (url.port && url.hostname !== "localhost") {
    const redirectTo = new URL(request.url);
    redirectTo.port = "";
    return new Response(`Moved permanently to ${redirectTo.href}`, {
      status: 301,
      headers: { location: redirectTo.href }
    });
  }
  return null;
}, "getPortRedirect");
var getRedirect = /* @__PURE__ */ __name((resp, savedSearch) => {
  if (!(resp.status === 301 && savedSearch)) return;
  const location = resp.headers.get("location");
  if (location && !location.match(/\?.*$/)) {
    resp.headers.set("location", `${location}${savedSearch}`);
  }
}, "getRedirect");
var getRUMRequest = /* @__PURE__ */ __name((request, url) => {
  if (!isRUMRequest(url)) return null;
  if (["GET", "POST", "OPTIONS"].includes(request.method)) return null;
  return new Response("Method Not Allowed", { status: 405 });
}, "getRUMRequest");
var formatSearchParams = /* @__PURE__ */ __name((url) => {
  const { search, searchParams } = url;
  if (isMediaRequest(url)) {
    for (const [key] of searchParams.entries()) {
      if (!["format", "height", "optimize", "width"].includes(key)) searchParams.delete(key);
    }
  } else if (getExtension(url.pathname) === "json") {
    for (const [key] of searchParams.entries()) {
      if (!["limit", "offset", "sheet"].includes(key)) searchParams.delete(key);
    }
  } else {
    url.search = "";
  }
  searchParams.sort();
  return search;
}, "formatSearchParams");
var formatRequest = /* @__PURE__ */ __name((env, url) => {
  url.hostname = env.AEM_HOSTNAME;
  url.port = "";
  url.protocol = "https:";
  const req = new Request(url);
  req.headers.set("x-forwarded-host", req.headers.get("host"));
  req.headers.set("x-byo-cdn-type", "cloudflare");
  if (env.PUSH_INVALIDATION !== "disabled") {
    req.headers.set("x-push-invalidation", "enabled");
  }
  if (env.ORIGIN_AUTHENTICATION) {
    req.headers.set("authorization", `token ${env.ORIGIN_AUTHENTICATION}`);
  }
  return req;
}, "formatRequest");
var getSchedule = /* @__PURE__ */ __name(async (pathname, response) => {
  if (!(pathname.includes("/schedules/") && pathname.endsWith("json"))) return null;
  const schedule2Response = /* @__PURE__ */ __name((json2) => new Response(JSON.stringify(json2), response), "schedule2Response");
  const json = await response.json();
  if (!json.data?.[0]?.fragment) return schedule2Response(json);
  const data = [];
  for (const [idx, schedule] of json.data.entries()) {
    const { start, end } = schedule;
    if (!start && !end) {
      data.push(json.data[idx]);
    } else {
      const now = Date.now();
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (startDate < now && endDate > now) data.push(json.data[idx]);
    }
  }
  return schedule2Response({ ...json, data });
}, "getSchedule");
var getCachability = /* @__PURE__ */ __name(({ pathname }) => !(pathname.includes("/schedules/") && pathname.endsWith("json")), "getCachability");
var fetchFromOrigin = /* @__PURE__ */ __name(async (req, cacheEverything, savedSearch) => {
  let resp = await fetch(req, { method: req.method, cf: { cacheEverything } });
  resp = new Response(resp.body, resp);
  const redirectResp = getRedirect(resp, savedSearch);
  if (redirectResp) return redirectResp;
  if (resp.status === 304) resp.headers.delete("Content-Security-Policy");
  resp.headers.delete("age");
  resp.headers.delete("x-robots-tag");
  return resp;
}, "fetchFromOrigin");
var index_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    const draftResp = getDraft(url);
    if (draftResp) return draftResp;
    const portResp = getPortRedirect(req, url);
    if (portResp) return portResp;
    const rumResp = getRUMRequest(req, url);
    if (rumResp) return rumResp;
    const request = formatRequest(env, url);
    const cacheable = getCachability(url);
    const savedSearch = formatSearchParams(url);
    const originResp = await fetchFromOrigin(request, cacheable, savedSearch);
    const scheduleResp = await getSchedule(url.pathname, originResp);
    if (scheduleResp) return scheduleResp;
    return originResp;
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
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-bZ9HAf/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = index_default;

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

// .wrangler/tmp/bundle-bZ9HAf/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
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
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map

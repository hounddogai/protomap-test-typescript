import type {
  handleBidiStreamingCall, handleClientStreamingCall, handleServerStreamingCall, handleUnaryCall,
} from "@grpc/grpc-js";
import { serviceError } from "./errors.js";
import { write } from "./streams.js";

export type Action<Req, Res> = (request: Req) => Promise<Res>;

/** Adapt promise-based domain operations to grpc-js's callback contract. */
export function unary<Req, Res>(action: Action<Req, Res>): handleUnaryCall<Req, Res> {
  return (call, done) => { void action(call.request).then((reply) => done(null, reply),
    (error: unknown) => done(serviceError(error))); };
}

export function serverStream<Req, Res>(action: Action<Req, Res>): handleServerStreamingCall<Req, Res> {
  return (call) => {
    void (async () => {
      const reply = await action(call.request);
      if (!call.cancelled) await write(call, reply);
      call.end();
    })().catch((error: unknown) => call.emit("error", serviceError(error)));
  };
}

export function clientStream<Req, Res>(action: Action<Req, Res>, empty: () => Res): handleClientStreamingCall<Req, Res> {
  return (call, done) => {
    void (async () => {
      let reply = empty();
      for await (const request of call as AsyncIterable<Req>) reply = await action(request);
      return reply;
    })().then((reply) => done(null, reply), (error: unknown) => done(serviceError(error)));
  };
}

export function duplex<Req, Res>(action: Action<Req, Res>): handleBidiStreamingCall<Req, Res> {
  return (call) => {
    void (async () => {
      // Reading the last request must leave the writable side alive until all replies and trailers have flushed.
      for await (const request of call.iterator({ destroyOnReturn: false }) as AsyncIterable<Req>) {
        if (call.cancelled) break;
        await write(call, await action(request));
      }
      call.end();
    })().catch((error: unknown) => call.emit("error", serviceError(error)));
  };
}

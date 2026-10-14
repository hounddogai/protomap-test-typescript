import { once } from "node:events";
import type { Writable } from "node:stream";
import type { ClientReadableStream, ClientWritableStream } from "@grpc/grpc-js";
import { requireReply } from "./errors.js";
import type { Callback } from "./rpc.js";

/** Observe backpressure on both client requests and server responses. */
export async function write<T>(stream: Writable, message: T): Promise<void> {
  if (!stream.write(message)) await once(stream, "drain");
}

export async function collect<T>(stream: ClientReadableStream<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of stream as AsyncIterable<T>) items.push(item);
  return items;
}

/** Upload a bounded group of records and wait for the server's single acknowledgment. */
export function upload<Req, Res>(open: (callback: Callback<Res>) => ClientWritableStream<Req>,
  requests: readonly Req[]): Promise<Res> {
  return new Promise((resolve, reject) => {
    const stream = open((error, response) => {
      if (error) reject(error);
      else {
        try { resolve(requireReply(response)); } catch (failure) { reject(failure); }
      }
    });
    stream.on("error", reject);
    void (async () => {
      for (const request of requests) await write(stream, request);
      stream.end();
    })().catch((error: unknown) => { stream.cancel(); reject(error); });
  });
}

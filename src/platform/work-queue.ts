import { EventEmitter } from "node:events";
import { status } from "@grpc/grpc-js";
import { RpcError } from "./errors.js";

interface WorkItem<Req, Res> {
  request: Req;
  resolve: (response: Res) => void;
  reject: (error: unknown) => void;
}

/** Request/reply work is consumed on the next event-loop turn by workers installed at server startup. */
export class WorkQueue {
  private readonly events = new EventEmitter();
  private stopped = false;
  private readonly pending = new Set<(error: unknown) => void>();

  consume<Req, Res>(topic: string, work: (request: Req) => Promise<Res>): void {
    if (this.events.listenerCount(topic)) throw new Error(`Worker already registered for ${topic}`);
    this.events.on(topic, (item: WorkItem<Req, Res>) => {
      setImmediate(() => {
        if (this.stopped) { item.reject(new RpcError(status.CANCELLED, "Worker stopped")); return; }
        void work(item.request).then(item.resolve, item.reject);
      });
    });
  }

  enqueue<Req, Res>(topic: string, request: Req): Promise<Res> {
    return new Promise((resolve, reject) => {
      if (this.stopped || !this.events.listenerCount(topic)) {
        reject(new RpcError(status.UNAVAILABLE, `No worker for ${topic}`));
        return;
      }
      const fail = (error: unknown) => { clearTimeout(timer); this.pending.delete(fail); reject(error); };
      const timer = setTimeout(() => fail(new RpcError(status.DEADLINE_EXCEEDED, "Worker timed out")), 30_000);
      this.pending.add(fail);
      this.events.emit(topic, {
        request, reject: fail,
        resolve: (response: Res) => { clearTimeout(timer); this.pending.delete(fail); resolve(response); },
      } satisfies WorkItem<Req, Res>);
    });
  }

  close(): void {
    this.stopped = true;
    for (const reject of this.pending) reject(new RpcError(status.CANCELLED, "Worker stopped"));
    this.events.removeAllListeners();
  }
}

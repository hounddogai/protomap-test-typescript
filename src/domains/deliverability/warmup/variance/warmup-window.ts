import * as text from "../../../../kit/text.js";

/** Where a warmup window is in its life cycle. */
export type WarmupWindowStatus = "new" | "queued" | "running" | "done" | "failed";

/** One warmup window, with what the planners need to act on it. */
export class WarmupWindow {
  code: string;
  name: string;
  maximum: number;
  audienceId: string;
  revision: number;
  source: string;
  updatedAt: number;
  status: WarmupWindowStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    audienceId: string,
    revision: number,
    source: string,
    updatedAt: number,
    status: WarmupWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.audienceId = audienceId;
    this.revision = revision;
    this.source = source;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WarmupWindowStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WarmupWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round(this.revision * this.updatedAt * 100) / 100;
  }

  copy(): WarmupWindow {
    return new WarmupWindow(
      this.code,
      this.name,
      this.maximum,
      this.audienceId,
      this.revision,
      this.source,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a warmup window in status new. */
export function newWarmupWindow(code: string, name: string): WarmupWindow {
  return new WarmupWindow(code, name, 0, "", 0, "", 0, "new");
}

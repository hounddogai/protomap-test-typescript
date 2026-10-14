import * as text from "../../../../kit/text.js";

/** Where a post metric is in its life cycle. */
export type PostMetricStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A post metric as the post team keeps it. */
export class PostMetric {
  code: string;
  label: string;
  ratio: number;
  source: string;
  openRate: number;
  summary: string;
  version: number;
  visible: boolean;
  status: PostMetricStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    source: string,
    openRate: number,
    summary: string,
    version: number,
    visible: boolean,
    status: PostMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.source = source;
    this.openRate = openRate;
    this.summary = summary;
    this.version = version;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostMetricStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PostMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"post metric"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.version * this.openRate * 100) / 100;
  }

  copy(): PostMetric {
    return new PostMetric(
      this.code,
      this.label,
      this.ratio,
      this.source,
      this.openRate,
      this.summary,
      this.version,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a post metric in status idle. */
export function newPostMetric(code: string, label: string): PostMetric {
  return new PostMetric(code, label, 0, "", 0, "", 0, false, "idle");
}

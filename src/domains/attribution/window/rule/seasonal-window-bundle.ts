import * as text from "../../../../kit/text.js";

/** Where a seasonal window bundle is in its life cycle. */
export type SeasonalWindowBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A seasonal window bundle as the window team keeps it. */
export class SeasonalWindowBundle {
  code: string;
  title: string;
  source: string;
  audienceId: string;
  batchSize: number;
  visible: boolean;
  status: SeasonalWindowBundleStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    audienceId: string,
    batchSize: number,
    visible: boolean,
    status: SeasonalWindowBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.audienceId = audienceId;
    this.batchSize = batchSize;
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

  canMoveTo(next: SeasonalWindowBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalWindowBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal window bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal window bundle"} ${this.code}`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): SeasonalWindowBundle {
    return new SeasonalWindowBundle(
      this.code,
      this.title,
      this.source,
      this.audienceId,
      this.batchSize,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a seasonal window bundle in status idle. */
export function newSeasonalWindowBundle(code: string, title: string): SeasonalWindowBundle {
  return new SeasonalWindowBundle(code, title, "", "", 0, false, "idle");
}

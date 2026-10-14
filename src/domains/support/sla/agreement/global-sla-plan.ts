import * as text from "../../../../kit/text.js";

/** Where a global sla plan is in its life cycle. */
export type GlobalSlaPlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A global sla plan as the sla team keeps it. */
export class GlobalSlaPlan {
  code: string;
  label: string;
  variant: string;
  visible: boolean;
  description: string;
  windowDays: number;
  ownerId: string;
  attempts: number;
  utmSource: string;
  status: GlobalSlaPlanStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    visible: boolean,
    description: string,
    windowDays: number,
    ownerId: string,
    attempts: number,
    utmSource: string,
    status: GlobalSlaPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.visible = visible;
    this.description = description;
    this.windowDays = windowDays;
    this.ownerId = ownerId;
    this.attempts = attempts;
    this.utmSource = utmSource;
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

  canMoveTo(next: GlobalSlaPlanStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalSlaPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global sla plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"global sla plan"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.windowDays * this.attempts * 100) / 100;
  }

  copy(): GlobalSlaPlan {
    return new GlobalSlaPlan(
      this.code,
      this.label,
      this.variant,
      this.visible,
      this.description,
      this.windowDays,
      this.ownerId,
      this.attempts,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a global sla plan in status idle. */
export function newGlobalSlaPlan(code: string, label: string): GlobalSlaPlan {
  return new GlobalSlaPlan(code, label, "", false, "", 0, "", 0, "", "idle");
}

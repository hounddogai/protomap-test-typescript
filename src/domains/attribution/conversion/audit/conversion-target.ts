import * as text from "../../../../kit/text.js";

/** Where a conversion target is in its life cycle. */
export type ConversionTargetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A conversion target. Its code is unique within a tenant. */
export class ConversionTarget {
  code: string;
  name: string;
  startsAt: number;
  phone: string;
  visible: boolean;
  active: boolean;
  summary: string;
  priority: number;
  ceiling: number;
  maximum: number;
  status: ConversionTargetStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    phone: string,
    visible: boolean,
    active: boolean,
    summary: string,
    priority: number,
    ceiling: number,
    maximum: number,
    status: ConversionTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.phone = phone;
    this.visible = visible;
    this.active = active;
    this.summary = summary;
    this.priority = priority;
    this.ceiling = ceiling;
    this.maximum = maximum;
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

  canMoveTo(next: ConversionTargetStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ConversionTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedTotal(): number {
    return Math.round((this.startsAt - this.priority) * 100) / 100;
  }

  copy(): ConversionTarget {
    return new ConversionTarget(
      this.code,
      this.name,
      this.startsAt,
      this.phone,
      this.visible,
      this.active,
      this.summary,
      this.priority,
      this.ceiling,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a conversion target in status idle. */
export function newConversionTarget(code: string, name: string): ConversionTarget {
  return new ConversionTarget(code, name, 0, "", false, false, "", 0, 0, 0, "idle");
}

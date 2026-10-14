import * as text from "../../../../kit/text.js";

/** Where a sender template is in its life cycle. */
export type SenderTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A sender template. Its code is unique within a tenant. */
export class SenderTemplate {
  code: string;
  name: string;
  segment: string;
  cost: number;
  utmSource: string;
  phone: string;
  ownerId: string;
  region: string;
  ratio: number;
  active: boolean;
  status: SenderTemplateStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    cost: number,
    utmSource: string,
    phone: string,
    ownerId: string,
    region: string,
    ratio: number,
    active: boolean,
    status: SenderTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.cost = cost;
    this.utmSource = utmSource;
    this.phone = phone;
    this.ownerId = ownerId;
    this.region = region;
    this.ratio = ratio;
    this.active = active;
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

  canMoveTo(next: SenderTemplateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
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

  moveTo(next: SenderTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round((this.cost + this.ratio) * 100) / 100;
  }

  copy(): SenderTemplate {
    return new SenderTemplate(
      this.code,
      this.name,
      this.segment,
      this.cost,
      this.utmSource,
      this.phone,
      this.ownerId,
      this.region,
      this.ratio,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a sender template in status idle. */
export function newSenderTemplate(code: string, name: string): SenderTemplate {
  return new SenderTemplate(code, name, "", 0, "", "", "", "", 0, false, "idle");
}

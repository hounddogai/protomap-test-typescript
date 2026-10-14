import * as text from "../../../../kit/text.js";

/** Where a touchpoint template is in its life cycle. */
export type TouchpointTemplateStatus = "created" | "validated" | "published" | "retired";

/** The record of a touchpoint template and its current status. */
export class TouchpointTemplate {
  code: string;
  name: string;
  threshold: number;
  channel: string;
  cost: number;
  ownerId: string;
  status: TouchpointTemplateStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    channel: string,
    cost: number,
    ownerId: string,
    status: TouchpointTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.channel = channel;
    this.cost = cost;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TouchpointTemplateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedValue(): number {
    return Math.round(this.threshold * this.cost * 100) / 100;
  }

  copy(): TouchpointTemplate {
    return new TouchpointTemplate(
      this.code,
      this.name,
      this.threshold,
      this.channel,
      this.cost,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a touchpoint template in status created. */
export function newTouchpointTemplate(code: string, name: string): TouchpointTemplate {
  return new TouchpointTemplate(code, name, 0, "", 0, "", "created");
}

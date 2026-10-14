/**
 * The sla target records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sla target is in its life cycle. */
export type SlaTargetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A sla target. Its code is unique within a tenant. */
export class SlaTarget {
  code: string;
  name: string;
  active: boolean;
  archived: boolean;
  endsAt: number;
  label: string;
  visible: boolean;
  contactEmail: string;
  status: SlaTargetStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    archived: boolean,
    endsAt: number,
    label: string,
    visible: boolean,
    contactEmail: string,
    status: SlaTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.archived = archived;
    this.endsAt = endsAt;
    this.label = label;
    this.visible = visible;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: SlaTargetStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: SlaTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"sla target"} ${this.code}`;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): SlaTarget {
    return new SlaTarget(
      this.code,
      this.name,
      this.active,
      this.archived,
      this.endsAt,
      this.label,
      this.visible,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a sla target in status idle. */
export function newSlaTarget(code: string, name: string): SlaTarget {
  return new SlaTarget(code, name, false, false, 0, "", false, "", "idle");
}

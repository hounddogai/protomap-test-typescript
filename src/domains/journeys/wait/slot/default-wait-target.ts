import * as text from "../../../../kit/text.js";

/** Where a default wait target is in its life cycle. */
export type DefaultWaitTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A default wait target as the wait team keeps it. */
export class DefaultWaitTarget {
  code: string;
  label: string;
  tags: string[];
  contactEmail: string;
  country: string;
  name: string;
  quantity: number;
  status: DefaultWaitTargetStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    contactEmail: string,
    country: string,
    name: string,
    quantity: number,
    status: DefaultWaitTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.contactEmail = contactEmail;
    this.country = country;
    this.name = name;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultWaitTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DefaultWaitTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default wait target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): DefaultWaitTarget {
    return new DefaultWaitTarget(
      this.code,
      this.label,
      this.tags,
      this.contactEmail,
      this.country,
      this.name,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a default wait target in status draft. */
export function newDefaultWaitTarget(code: string, label: string): DefaultWaitTarget {
  return new DefaultWaitTarget(code, label, [], "", "", "", 0, "draft");
}

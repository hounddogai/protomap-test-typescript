import * as text from "../../../../kit/text.js";

/** Where a ticket view digest is in its life cycle. */
export type TicketViewDigestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A ticket view digest. Its code is unique within a tenant. */
export class TicketViewDigest {
  code: string;
  label: string;
  variant: string;
  tags: string[];
  weight: number;
  status: TicketViewDigestStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    tags: string[],
    weight: number,
    status: TicketViewDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.tags = tags;
    this.weight = weight;
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

  canMoveTo(next: TicketViewDigestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TicketViewDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): TicketViewDigest {
    return new TicketViewDigest(this.code, this.label, this.variant, this.tags, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a ticket view digest in status draft. */
export function newTicketViewDigest(code: string, label: string): TicketViewDigest {
  return new TicketViewDigest(code, label, "", [], 0, "draft");
}

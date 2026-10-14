import * as text from "../../../../kit/text.js";

/** Where a escalation manifest is in its life cycle. */
export type EscalationManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One escalation manifest, with what the planners need to act on it. */
export class EscalationManifest {
  code: string;
  name: string;
  attributes: Map<string, string>;
  expiresAt: number;
  checksum: string;
  cost: number;
  score: number;
  status: EscalationManifestStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    expiresAt: number,
    checksum: string,
    cost: number,
    score: number,
    status: EscalationManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.expiresAt = expiresAt;
    this.checksum = checksum;
    this.cost = cost;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: EscalationManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: EscalationManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedLoad(): number {
    return Math.round(this.cost * this.expiresAt * 100) / 100;
  }

  copy(): EscalationManifest {
    return new EscalationManifest(
      this.code,
      this.name,
      this.attributes,
      this.expiresAt,
      this.checksum,
      this.cost,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a escalation manifest in status planned. */
export function newEscalationManifest(code: string, name: string): EscalationManifest {
  return new EscalationManifest(code, name, new Map<string, string>(), 0, "", 0, 0, "planned");
}

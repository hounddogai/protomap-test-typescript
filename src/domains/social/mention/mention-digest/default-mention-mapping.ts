import * as text from "../../../../kit/text.js";

/** Where a default mention mapping is in its life cycle. */
export type DefaultMentionMappingStatus = "requested" | "granted" | "revoked" | "expired";

/** A default mention mapping. Its code is unique within a tenant. */
export class DefaultMentionMapping {
  code: string;
  label: string;
  ownerId: string;
  durationMinutes: number;
  maximum: number;
  budget: number;
  tags: string[];
  status: DefaultMentionMappingStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    durationMinutes: number,
    maximum: number,
    budget: number,
    tags: string[],
    status: DefaultMentionMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.durationMinutes = durationMinutes;
    this.maximum = maximum;
    this.budget = budget;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultMentionMappingStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DefaultMentionMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default mention mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netExposure(): number {
    return Math.round((this.durationMinutes + this.maximum) * 100) / 100;
  }

  copy(): DefaultMentionMapping {
    return new DefaultMentionMapping(
      this.code,
      this.label,
      this.ownerId,
      this.durationMinutes,
      this.maximum,
      this.budget,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default mention mapping in status requested. */
export function newDefaultMentionMapping(code: string, label: string): DefaultMentionMapping {
  return new DefaultMentionMapping(code, label, "", 0, 0, 0, [], "requested");
}

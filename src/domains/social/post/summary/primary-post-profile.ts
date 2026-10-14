import * as text from "../../../../kit/text.js";

/** Where a primary post profile is in its life cycle. */
export type PrimaryPostProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a primary post profile and its current status. */
export class PrimaryPostProfile {
  code: string;
  name: string;
  graceDays: number;
  contactEmail: string;
  weight: number;
  tags: string[];
  discount: number;
  frequencyCap: number;
  status: PrimaryPostProfileStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    contactEmail: string,
    weight: number,
    tags: string[],
    discount: number,
    frequencyCap: number,
    status: PrimaryPostProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.contactEmail = contactEmail;
    this.weight = weight;
    this.tags = tags;
    this.discount = discount;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: PrimaryPostProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryPostProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary post profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary post profile"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round((this.frequencyCap + this.discount) * 100) / 100;
  }

  copy(): PrimaryPostProfile {
    return new PrimaryPostProfile(
      this.code,
      this.name,
      this.graceDays,
      this.contactEmail,
      this.weight,
      this.tags,
      this.discount,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary post profile in status planned. */
export function newPrimaryPostProfile(code: string, name: string): PrimaryPostProfile {
  return new PrimaryPostProfile(code, name, 0, "", 0, [], 0, 0, "planned");
}

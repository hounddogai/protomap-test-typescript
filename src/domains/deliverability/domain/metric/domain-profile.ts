import * as text from "../../../../kit/text.js";

/** Where a domain profile is in its life cycle. */
export type DomainProfileStatus = "created" | "validated" | "published" | "retired";

/** The record of a domain profile and its current status. */
export class DomainProfile {
  code: string;
  label: string;
  category: string;
  revision: number;
  bid: number;
  tags: string[];
  name: string;
  locale: string;
  status: DomainProfileStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    revision: number,
    bid: number,
    tags: string[],
    name: string,
    locale: string,
    status: DomainProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.revision = revision;
    this.bid = bid;
    this.tags = tags;
    this.name = name;
    this.locale = locale;
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

  canMoveTo(next: DomainProfileStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DomainProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
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

  projectedValue(): number {
    return Math.round(this.bid * this.revision * 100) / 100;
  }

  copy(): DomainProfile {
    return new DomainProfile(
      this.code,
      this.label,
      this.category,
      this.revision,
      this.bid,
      this.tags,
      this.name,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a domain profile in status created. */
export function newDomainProfile(code: string, label: string): DomainProfile {
  return new DomainProfile(code, label, "", 0, 0, [], "", "", "created");
}

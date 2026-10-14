import * as text from "../../../../kit/text.js";

/** Where a domain request is in its life cycle. */
export type DomainRequestStatus = "created" | "validated" | "published" | "retired";

/** The record of a domain request and its current status. */
export class DomainRequest {
  code: string;
  title: string;
  name: string;
  tags: string[];
  discount: number;
  status: DomainRequestStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    tags: string[],
    discount: number,
    status: DomainRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.tags = tags;
    this.discount = discount;
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

  canMoveTo(next: DomainRequestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): DomainRequest {
    return new DomainRequest(this.code, this.title, this.name, this.tags, this.discount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a domain request in status created. */
export function newDomainRequest(code: string, title: string): DomainRequest {
  return new DomainRequest(code, title, "", [], 0, "created");
}

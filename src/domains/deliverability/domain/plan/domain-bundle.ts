import * as text from "../../../../kit/text.js";

/** Where a domain bundle is in its life cycle. */
export type DomainBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One domain bundle, with what the planners need to act on it. */
export class DomainBundle {
  code: string;
  title: string;
  name: string;
  utmSource: string;
  description: string;
  frequencyCap: number;
  version: number;
  status: DomainBundleStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    utmSource: string,
    description: string,
    frequencyCap: number,
    version: number,
    status: DomainBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.utmSource = utmSource;
    this.description = description;
    this.frequencyCap = frequencyCap;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: DomainBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DomainBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveValue(): number {
    return Math.round((this.version - this.frequencyCap) * 100) / 100;
  }

  copy(): DomainBundle {
    return new DomainBundle(
      this.code,
      this.title,
      this.name,
      this.utmSource,
      this.description,
      this.frequencyCap,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a domain bundle in status proposed. */
export function newDomainBundle(code: string, title: string): DomainBundle {
  return new DomainBundle(code, title, "", "", "", 0, 0, "proposed");
}

import * as text from "../../../../kit/text.js";

/** Where a path bundle is in its life cycle. */
export type PathBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A path bundle. Its code is unique within a tenant. */
export class PathBundle {
  code: string;
  title: string;
  retries: number;
  startsAt: number;
  contactEmail: string;
  channel: string;
  status: PathBundleStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    startsAt: number,
    contactEmail: string,
    channel: string,
    status: PathBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.startsAt = startsAt;
    this.contactEmail = contactEmail;
    this.channel = channel;
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

  canMoveTo(next: PathBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
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

  moveTo(next: PathBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round((this.retries + this.startsAt) * 100) / 100;
  }

  copy(): PathBundle {
    return new PathBundle(
      this.code,
      this.title,
      this.retries,
      this.startsAt,
      this.contactEmail,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a path bundle in status proposed. */
export function newPathBundle(code: string, title: string): PathBundle {
  return new PathBundle(code, title, 0, 0, "", "", "proposed");
}

import * as text from "../../../../kit/text.js";

/** Where a path template is in its life cycle. */
export type PathTemplateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A path template. Its code is unique within a tenant. */
export class PathTemplate {
  code: string;
  name: string;
  phone: string;
  label: string;
  pinned: boolean;
  visible: boolean;
  windowDays: number;
  startsAt: number;
  clicks: number;
  status: PathTemplateStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    label: string,
    pinned: boolean,
    visible: boolean,
    windowDays: number,
    startsAt: number,
    clicks: number,
    status: PathTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.label = label;
    this.pinned = pinned;
    this.visible = visible;
    this.windowDays = windowDays;
    this.startsAt = startsAt;
    this.clicks = clicks;
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

  canMoveTo(next: PathTemplateStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PathTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"path template"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.clicks + this.startsAt) * 100) / 100;
  }

  copy(): PathTemplate {
    return new PathTemplate(
      this.code,
      this.name,
      this.phone,
      this.label,
      this.pinned,
      this.visible,
      this.windowDays,
      this.startsAt,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a path template in status draft. */
export function newPathTemplate(code: string, name: string): PathTemplate {
  return new PathTemplate(code, name, "", "", false, false, 0, 0, 0, "draft");
}

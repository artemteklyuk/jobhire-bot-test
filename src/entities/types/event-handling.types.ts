export type RegisterEventData<T = any> = {
  eventName: string;
  uid: string;
  data?: T;
};

export type AcknowledgeTaskData = {
  uid: string;
  taskId: number;
  result?: any;
};

export type AcknowledgeTasksByTypeData = {
  uid: string;
  type: string;
};

export type ViewEventData = {
  uid: string;
  tasks: number[];
};

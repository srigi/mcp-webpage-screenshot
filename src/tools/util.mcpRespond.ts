import { getLogger } from '~/utils/logger';

export function respondError(
  error: Error,
  label: string,
): {
  _meta: {
    error: { type: string; message: string };
    success: false;
  };
  content: Array<{ type: 'text'; text: string }>;
} {
  getLogger().error(`${label} ${error.message}`, { error });

  return {
    _meta: {
      error: { type: error.constructor.name, message: error.message },
      success: false,
    },
    content: [
      {
        type: 'text' as const,
        text: `${label} error: ${error.message}`,
      },
    ],
  };
}

export function respondSuccess(
  text: string,
  label: string,
  ...extra: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
): {
  _meta: { success: true };
  content: Array<{ type: 'text'; text: string }>;
} {
  getLogger().info(`${label} ${text}`, ...extra);

  return {
    _meta: { success: true },
    content: [
      {
        type: 'text' as const,
        text,
      },
    ],
  };
}

/** Merges a patch into the current addon params blob (updateParams replaces the whole object). */
export const mergeDonatePayParams = async <T extends Record<string, unknown>>(
  patch: T
) => {
  const current = await api.config.getParams<Record<string, unknown>>();
  return api.config.updateParams({ ...current, ...patch });
};

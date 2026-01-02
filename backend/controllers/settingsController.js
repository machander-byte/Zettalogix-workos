import { getSettings, updateSettings } from '../services/settingsService.js';

export const getActivitySettings = async (req, res) => {
  const settings = await getSettings();
  res.json(settings);
};

export const saveActivitySettings = async (req, res) => {
  const updates = req.body || {};
  const settings = await updateSettings(updates);
  res.json(settings);
};

export const getBrowserSettings = async (req, res) => {
  const settings = await getSettings();
  res.json({
    browserEnabled: settings.browserEnabled ?? false,
    browserHomeUrl: settings.browserHomeUrl ?? '',
    browserAllowedUrls: settings.browserAllowedUrls ?? []
  });
};

export const saveBrowserSettings = async (req, res) => {
  const { browserEnabled, browserHomeUrl, browserAllowedUrls } = req.body || {};
  const normalizedList = Array.isArray(browserAllowedUrls)
    ? browserAllowedUrls
        .filter(Boolean)
        .map((url) => String(url).trim())
        .filter((url) => url.length > 0)
    : undefined;

  const updates = {};
  if (typeof browserEnabled === 'boolean') updates.browserEnabled = browserEnabled;
  if (typeof browserHomeUrl === 'string') updates.browserHomeUrl = browserHomeUrl;
  if (normalizedList !== undefined) updates.browserAllowedUrls = normalizedList;

  const settings = await updateSettings(updates);
  res.json({
    browserEnabled: settings.browserEnabled ?? false,
    browserHomeUrl: settings.browserHomeUrl ?? '',
    browserAllowedUrls: settings.browserAllowedUrls ?? []
  });
};

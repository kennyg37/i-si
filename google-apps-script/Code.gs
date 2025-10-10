const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
const SHEET_NAME = 'Subscriptions';

function getSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName(SHEET_NAME);
}

function doGet(e) {
  const action = e.parameter.action;

  try {
    switch (action) {
      case 'getAll':
        return respond(getAllSubscriptions());
      case 'getActive':
        return respond(getActiveSubscriptions());
      case 'getById':
        return respond(getSubscriptionById(e.parameter.id));
      case 'getByEmail':
        return respond(getSubscriptionByEmail(e.parameter.email));
      case 'getNeedingNotifications':
        return respond(getSubscriptionsNeedingNotifications());
      case 'getStats':
        return respond(getStats());
      default:
        return respond({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    return respond({ error: error.toString() }, 500);
  }
}

function doPost(e) {
  const action = e.parameter.action;
  const data = JSON.parse(e.postData.contents);

  try {
    switch (action) {
      case 'create':
        return respond(createSubscription(data));
      case 'verify':
        return respond(verifySubscription(data.id));
      case 'update':
        return respond(updateSubscription(data.id, data.preferences));
      case 'updateLastNotified':
        updateLastNotified(data.id);
        return respond({ success: true });
      case 'unsubscribe':
        return respond({ success: unsubscribeByToken(data.token) });
      case 'delete':
        return respond({ success: deleteSubscription(data.id) });
      default:
        return respond({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    return respond({ error: error.toString() }, 500);
  }
}

function respond(data, code = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function getAllSubscriptions() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => rowToObject(row, headers));
}

function getActiveSubscriptions() {
  return getAllSubscriptions().filter(sub => sub.isActive === true);
}

function getSubscriptionById(id) {
  const subs = getAllSubscriptions();
  return subs.find(sub => sub.id === id) || null;
}

function getSubscriptionByEmail(email) {
  const subs = getAllSubscriptions();
  return subs.find(sub => sub.email === email) || null;
}

function createSubscription(data) {
  const existing = getSubscriptionByEmail(data.email);
  if (existing) {
    throw new Error('Email already subscribed');
  }

  const sheet = getSheet();
  const id = generateId();
  const unsubscribeToken = generateToken();

  const subscription = {
    id: id,
    email: data.email,
    lat: data.coordinates.lat,
    lon: data.coordinates.lon,
    location: data.location || '',
    eventTypes: JSON.stringify(data.preferences.eventTypes),
    minSeverity: data.preferences.minSeverity,
    frequency: data.preferences.frequency,
    digestTime: data.preferences.digestTime || '',
    isActive: false,
    createdAt: new Date().toISOString(),
    lastNotified: '',
    verifiedAt: '',
    unsubscribeToken: unsubscribeToken
  };

  sheet.appendRow([
    subscription.id,
    subscription.email,
    subscription.lat,
    subscription.lon,
    subscription.location,
    subscription.eventTypes,
    subscription.minSeverity,
    subscription.frequency,
    subscription.digestTime,
    subscription.isActive,
    subscription.createdAt,
    subscription.lastNotified,
    subscription.verifiedAt,
    subscription.unsubscribeToken
  ]);

  return objectFromRow(subscription);
}

function verifySubscription(id) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 10).setValue(true);
      sheet.getRange(i + 1, 13).setValue(new Date().toISOString());

      return rowToObject(sheet.getRange(i + 1, 1, 1, headers.length).getValues()[0], headers);
    }
  }

  return null;
}

function updateSubscription(id, preferences) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      if (preferences.eventTypes) {
        sheet.getRange(i + 1, 6).setValue(JSON.stringify(preferences.eventTypes));
      }
      if (preferences.minSeverity) {
        sheet.getRange(i + 1, 7).setValue(preferences.minSeverity);
      }
      if (preferences.frequency) {
        sheet.getRange(i + 1, 8).setValue(preferences.frequency);
      }
      if (preferences.digestTime !== undefined) {
        sheet.getRange(i + 1, 9).setValue(preferences.digestTime);
      }

      return rowToObject(sheet.getRange(i + 1, 1, 1, headers.length).getValues()[0], headers);
    }
  }

  return null;
}

function updateLastNotified(id) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 12).setValue(new Date().toISOString());
      return;
    }
  }
}

function unsubscribeByToken(token) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][13] === token) {
      sheet.getRange(i + 1, 10).setValue(false);
      return true;
    }
  }

  return false;
}

function deleteSubscription(id) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }

  return false;
}

function getSubscriptionsNeedingNotifications() {
  const subscriptions = getActiveSubscriptions();
  const now = Date.now();

  return subscriptions.filter(sub => {
    if (sub.preferences.frequency === 'immediate') {
      return true;
    }

    if (sub.preferences.frequency === 'daily') {
      if (!sub.lastNotified) return true;
      const lastNotified = new Date(sub.lastNotified).getTime();
      return now - lastNotified >= 24 * 60 * 60 * 1000;
    }

    if (sub.preferences.frequency === 'weekly') {
      if (!sub.lastNotified) return true;
      const lastNotified = new Date(sub.lastNotified).getTime();
      return now - lastNotified >= 7 * 24 * 60 * 60 * 1000;
    }

    return false;
  });
}

function getStats() {
  const subscriptions = getAllSubscriptions();

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(sub => sub.isActive).length,
    inactive: subscriptions.filter(sub => !sub.isActive).length,
    byFrequency: {
      immediate: 0,
      daily: 0,
      weekly: 0
    }
  };

  subscriptions.forEach(sub => {
    if (sub.isActive && sub.preferences && sub.preferences.frequency) {
      stats.byFrequency[sub.preferences.frequency] = (stats.byFrequency[sub.preferences.frequency] || 0) + 1;
    }
  });

  return stats;
}

function rowToObject(row, headers) {
  const obj = {
    id: row[0],
    email: row[1],
    coordinates: {
      lat: parseFloat(row[2]),
      lon: parseFloat(row[3])
    },
    location: row[4],
    preferences: {
      eventTypes: JSON.parse(row[5] || '{}'),
      minSeverity: row[6],
      frequency: row[7],
      digestTime: row[8]
    },
    isActive: row[9] === true || row[9] === 'TRUE',
    createdAt: row[10],
    lastNotified: row[11],
    verifiedAt: row[12],
    unsubscribeToken: row[13]
  };

  return obj;
}

function objectFromRow(subscription) {
  return {
    id: subscription.id,
    email: subscription.email,
    coordinates: {
      lat: subscription.lat,
      lon: subscription.lon
    },
    location: subscription.location,
    preferences: {
      eventTypes: JSON.parse(subscription.eventTypes),
      minSeverity: subscription.minSeverity,
      frequency: subscription.frequency,
      digestTime: subscription.digestTime
    },
    isActive: subscription.isActive,
    createdAt: subscription.createdAt,
    lastNotified: subscription.lastNotified,
    verifiedAt: subscription.verifiedAt,
    unsubscribeToken: subscription.unsubscribeToken
  };
}

function generateId() {
  return Utilities.getUuid();
}

function generateToken() {
  return Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
}

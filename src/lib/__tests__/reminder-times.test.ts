import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MAX_TIMES_PER_HABIT,
  describeReminders,
  formatTime,
  isTime,
  normalizeTimes,
  reminderTimes,
  repeatingTimes,
  shiftTime,
} from '../reminder-times.ts';

test('formats 24-hour times for people', () => {
  assert.equal(formatTime('00:05'), '12:05 AM');
  assert.equal(formatTime('08:00'), '8:00 AM');
  assert.equal(formatTime('12:30'), '12:30 PM');
  assert.equal(formatTime('21:30'), '9:30 PM');
});

test('shifting wraps around midnight', () => {
  assert.equal(shiftTime('23:45', 30), '00:15');
  assert.equal(shiftTime('00:00', -15), '23:45');
});

test('every 2 hours from 8 AM to 8 PM gives 7 reminders and none at night', () => {
  assert.deepEqual(repeatingTimes(2, '08:00', '20:00'), ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']);
  assert.equal(repeatingTimes(1, '00:00', '23:30').length, MAX_TIMES_PER_HABIT);
  assert.deepEqual(repeatingTimes(3, '20:00', '08:00'), ['20:00']);
});

test('set times are sorted, de-duplicated and validated', () => {
  assert.deepEqual(normalizeTimes(['19:00', '08:00', '19:00', '25:00', 'soon']), ['08:00', '19:00']);
  assert.equal(isTime('07:59'), true);
  assert.equal(isTime('7:59'), false);
});

test('describes reminders in plain words', () => {
  assert.equal(describeReminders(undefined), null);
  assert.equal(describeReminders({ kind: 'times', times: ['19:00', '08:00'] }), '8:00 AM and 7:00 PM');
  assert.equal(describeReminders({ kind: 'times', times: ['08:00', '12:00', '19:00'] }), '3 times a day');
  assert.equal(
    describeReminders({ kind: 'repeat', everyHours: 2, start: '08:00', end: '20:00' }),
    'Every 2 hours, 8:00 AM to 8:00 PM',
  );
  assert.deepEqual(reminderTimes({ kind: 'times', times: [] }), []);
});

-- Make the new Vex language and learning track visible for existing installs.
-- Fresh installations already receive these IDs from _worker.js defaults.
UPDATE admin_settings
SET value = json_insert(value, '$[#]', 'vex'),
    updated_at = CAST(strftime('%s', 'now') AS INTEGER)
WHERE key = 'visibleLanguages'
  AND json_valid(value)
  AND json_type(value) = 'array'
  AND NOT EXISTS (
    SELECT 1 FROM json_each(admin_settings.value) WHERE value = 'vex'
  );

UPDATE admin_settings
SET value = json_insert(value, '$[#]', 'vex'),
    updated_at = CAST(strftime('%s', 'now') AS INTEGER)
WHERE key = 'visibleCourses'
  AND json_valid(value)
  AND json_type(value) = 'array'
  AND NOT EXISTS (
    SELECT 1 FROM json_each(admin_settings.value) WHERE value = 'vex'
  );

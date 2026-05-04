WITH candidate_links AS (
  SELECT
    vs.id AS shift_id,
    es.id AS event_session_id,
    count(*) OVER (PARTITION BY vs.id) AS matching_session_count
  FROM volunteer_shifts vs
  JOIN event_sessions es
    ON es.day = vs.day
   AND lower(regexp_replace(es.location, '\s*\(hq\)\s*$', '', 'i')) = lower(
      CASE
        WHEN vs.location = 'Boulder Public Library' THEN 'Boulder Library'
        WHEN vs.location = '1615 Pearl St.' THEN '1615 Pearl'
        WHEN vs.location = 'Siena Square' THEN 'Siena Square'
        ELSE vs.location
      END
    )
   AND vs.start_time < es.end_time
   AND vs.end_time > es.start_time
  WHERE vs.event_session_id IS NULL
)
UPDATE volunteer_shifts vs
SET event_session_id = candidate_links.event_session_id
FROM candidate_links
WHERE vs.id = candidate_links.shift_id
  AND candidate_links.matching_session_count = 1;

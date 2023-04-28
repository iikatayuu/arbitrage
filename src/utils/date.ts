
export function getTime (timestamp: number) {
  const date = new Date(timestamp);
  let hours = date.getHours().toString();
  while (hours.length < 2) hours = `0${hours}`;
  let minutes = date.getMinutes().toString();
  while (minutes.length < 2) minutes = `0${minutes}`;
  let seconds = date.getSeconds().toString();
  while (seconds.length < 2) seconds = `0${seconds}`;

  return `${hours}:${minutes}:${seconds}`;
}

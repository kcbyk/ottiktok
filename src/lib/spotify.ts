export async function createSpotifyPlaylist(
  accessToken: string,
  playlistName: string,
  description: string,
  songs: { artist: string; title: string }[]
) {
  // 1. Get User ID
  const userRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) throw new Error("Spotify kullanici bilgileri alinamadi");
  const userData = await userRes.json();
  const userId = userData.id;

  // 2. Create Playlist
  const createRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: playlistName,
      description: description,
      public: true,
    }),
  });
  if (!createRes.ok) throw new Error("Spotify playlist olusturulamadi");
  const playlistData = await createRes.json();
  const playlistId = playlistData.id;
  const playlistUrl = playlistData.external_urls?.spotify;

  // 3. Search for songs and collect URIs
  const uris: string[] = [];
  for (const song of songs) {
    const query = encodeURIComponent(`${song.title} ${song.artist}`);
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const track = searchData.tracks?.items?.[0];
      if (track && track.uri) {
        uris.push(track.uri);
      }
    }
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 100));
  }

  // 4. Add tracks to playlist
  if (uris.length > 0) {
    // Spotify allows up to 100 tracks per request, which is fine since we have ~12
    const addRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: uris,
      }),
    });
    if (!addRes.ok) throw new Error("Sarkilar playliste eklenemedi");
  }

  return { success: true, url: playlistUrl, found: uris.length, total: songs.length };
}

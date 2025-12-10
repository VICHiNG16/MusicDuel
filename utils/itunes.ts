export interface Song {
    trackId: number;
    trackName: string;
    artistName: string;
    previewUrl: string;
    artworkUrl100: string;
}

export async function fetchMusicData(artist: string): Promise<Song[]> {
    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=50`);
        const data = await response.json();

        // Filter out songs without previewUrl
        const songs = data.results.filter((s: any) => s.previewUrl && s.kind === 'song');

        return songs.map((s: any) => ({
            trackId: s.trackId,
            trackName: s.trackName,
            artistName: s.artistName,
            previewUrl: s.previewUrl,
            artworkUrl100: s.artworkUrl100.replace('100x100', '600x600'), // Get higher quality art
        }));
    } catch (error) {
        console.error("Error fetching music data:", error);
        return [];
    }
}

export async function searchArtists(query: string) {
    if (!query || query.length < 2) return [];
    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&limit=5`);
        const data = await response.json();
        return data.results.map((r: any) => ({
            artistId: r.artistId,
            artistName: r.artistName,
            primaryGenreName: r.primaryGenreName
        }));
    } catch (error) {
        console.error("Error searching artists:", error);
        return [];
    }
}

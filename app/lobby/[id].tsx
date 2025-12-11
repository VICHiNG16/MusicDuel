import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackgroundGradient } from '../../components/BackgroundGradient';
import { GlassButton } from '../../components/GlassButton';
import { Colors } from '../../constants/Colors';
import { ref, set, onValue, update } from 'firebase/database';
import { db } from '../../utils/firebaseConfig';
import { fetchMusicData } from '../../utils/itunes';

export default function LobbyScreen() {
    const { id, isHost, artist, mode } = useLocalSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState('waiting');
    const [guestJoined, setGuestJoined] = useState(false);
    const [error, setError] = useState('');

    const isSolo = mode === 'solo';

    // Host setup
    useEffect(() => {
        if (isHost === 'true') {
            const roomRef = ref(db, `rooms/${id}`);
            // Only set initial data if it doesn't exist to avoid overwriting guest? 
            // Actually standard Set is fine for creation, but let's be careful.
            set(roomRef, {
                host: true,
                artist: artist,
                status: 'waiting',
                createdAt: Date.now()
            });

            const unsub = onValue(roomRef, (snapshot) => {
                const data = snapshot.val();
                if (data && data.guest) {
                    setGuestJoined(true);
                }
            });
            return () => unsub();
        } else {
            // Guest setup
            const roomRef = ref(db, `rooms/${id}`);

            // Check if room exists first logic could go here, but strictly relying on database
            update(roomRef, {
                guest: true
            }).catch(err => setError(err.message)); // Catch write errors

            const unsub = onValue(roomRef, (snapshot) => {
                const data = snapshot.val();
                if (data?.status === 'playing') {
                    router.replace(`/game/${id}?isHost=false`);
                }
            });
            return () => unsub();
        }
    }, [id, isHost]);

    const startGame = async () => {
        if (!artist) return;
        setStatus('loading');
        try {
            const songs = await fetchMusicData(artist as string);
            if (songs.length < 5) {
                setError('Not enough songs found for this artist.');
                setStatus('waiting');
                return;
            }

            // Select 5 random songs and generate wrong choices for each
            const shuffled = songs.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 5).map((song) => {
                // Find 3 wrong choices from the list (excluding current song)
                const wrong = songs.filter(s => s.trackId !== song.trackId)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3)
                    .map(s => ({
                        trackName: s.trackName,
                        artworkUrl100: s.artworkUrl100,
                        trackId: s.trackId
                    }));

                // Combine correct and wrong, then shuffle
                const correct = {
                    trackName: song.trackName,
                    artworkUrl100: song.artworkUrl100,
                    trackId: song.trackId
                };

                const options = [...wrong, correct].sort(() => 0.5 - Math.random());

                return {
                    ...song,
                    options
                };
            });

            // Push to firebase
            await update(ref(db, `rooms/${id}`), {
                status: 'playing',
                songs: selected,
                currentRound: 0,
                scores: { host: 0, guest: 0 },
                gameState: 'preview' // 'preview', 'waiting', 'reveal'
            });

            router.replace(`/game/${id}?isHost=true&mode=${isSolo ? 'solo' : 'multi'}`);
        } catch (e) {
            console.error(e);
            setError('Failed to start game');
            setStatus('waiting');
        }
    };

    return (
        <View style={styles.container}>
            <BackgroundGradient />
            <View style={styles.content}>
                <Text style={styles.title}>LOBBY</Text>
                <Text style={styles.code}>CODE: {id}</Text>

                {isHost === 'true' ? (
                    <>
                        <Text style={styles.status}>
                            Artist: <Text style={{ color: Colors.primary }}>{artist}</Text>
                        </Text>
                        <Text style={styles.status}>
                            {isSolo ? "Solo Mode Active" : (guestJoined ? "Player 2 Joined!" : "Waiting for opponent...")}
                        </Text>
                        {(guestJoined || isSolo) && (
                            <GlassButton
                                title={status === 'loading' ? "Loading..." : "START GAME"}
                                onPress={startGame}
                                style={{ marginTop: 40 }}
                            />
                        )}
                    </>
                ) : (
                    <Text style={styles.status}>Waiting for host to start...</Text>
                )}

                {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    title: { fontSize: 32, color: Colors.text, fontWeight: 'bold', marginBottom: 20 },
    code: { fontSize: 48, color: Colors.primary, fontWeight: '900', letterSpacing: 4, marginBottom: 40 },
    status: { fontSize: 18, color: Colors.textSecondary, marginBottom: 10 },
    error: { color: Colors.error, marginTop: 20 }
});

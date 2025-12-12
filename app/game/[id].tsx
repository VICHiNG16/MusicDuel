import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { BackgroundGradient } from '../../components/BackgroundGradient';
import { GlassButton } from '../../components/GlassButton';
import { Colors } from '../../constants/Colors';
import { ref, update, onValue } from 'firebase/database';
import { db } from '../../utils/firebaseConfig';
import Animated, { FadeIn, SlideInDown, ZoomIn, FadeInUp, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { ScoreTicker } from '../../components/ScoreTicker';
import { SongCard } from '../../components/SongCard';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

export default function GameScreen() {
    const { id, isHost, mode } = useLocalSearchParams();
    const router = useRouter();
    const [gameData, setGameData] = useState<any>(null);
    const [timeRemaining, setTimeRemaining] = useState(30);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [hasGuessed, setHasGuessed] = useState(false);
    const [guessCorrect, setGuessCorrect] = useState(false);
    const [localScoreDelta, setLocalScoreDelta] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const role = isHost === 'true' ? 'host' : 'guest';
    const opponentRole = role === 'host' ? 'guest' : 'host';

    // Game Data Listener
    useEffect(() => {
        const roomRef = ref(db, `rooms/${id}`);
        const unsub = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setGameData(data);
            }
        });
        return () => unsub();
    }, [id]);

    const currentSong = gameData?.songs?.[gameData?.currentRound];
    const isReveal = gameData?.gameState === 'reveal';
    const revealProcessed = useRef<number>(-1); // Track processed round

    // Manual Music Control
    const toggleMusic = async () => {
        if (!sound) return;
        if (isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
        } else {
            await sound.playAsync();
            setIsPlaying(true);
        }
    };

    // Music Player & Timer Logic
    useEffect(() => {
        let timer: NodeJS.Timeout;

        const loadMusic = async () => {
            if (!currentSong?.previewUrl) return;

            try {
                if (sound) await sound.unloadAsync();

                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: currentSong.previewUrl },
                    { shouldPlay: false }
                );
                setSound(newSound);
                setIsPlaying(false);
            } catch (err) {
                console.error("Failed to load sound", err);
            }
        };

        if (gameData?.gameState === 'preview') {
            // Reset state for new round
            setHasGuessed(false);
            setGuessCorrect(false);
            setLocalScoreDelta(0);
            setTimeRemaining(30);

            loadMusic();

            // Start Timer
            timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleGuessTimeout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } else if (isReveal) {
            // Stop music on reveal
            if (sound) {
                try {
                    sound.stopAsync();
                    setIsPlaying(false);
                } catch (e) {
                    // Ignore sound errors on web
                }
            }
        }

        return () => {
            clearInterval(timer);
            if (sound) sound.unloadAsync();
        };
    }, [gameData?.currentRound, gameData?.gameState]);


    const handleGuess = async (selectedTitle: string) => {
        if (hasGuessed || isReveal) return;

        setHasGuessed(true);
        const isCorrect = selectedTitle === currentSong.trackName;
        setGuessCorrect(isCorrect);

        // Calc score
        const points = isCorrect ? 1000 + (timeRemaining * 10) : 0;
        setLocalScoreDelta(points);

        // Send guess to firebase
        await update(ref(db, `rooms/${id}/playerGuesses/${role}`), {
            guess: selectedTitle,
            scoreDelta: points
        });
    };

    const handleGuessTimeout = () => {
        if (!hasGuessed && !isReveal) {
            handleGuess("TIMEOUT");
        }
    };

    // Host Logic: Watch for guesses -> Reveal
    useEffect(() => {
        if (isHost === 'true' && gameData?.playerGuesses && gameData.gameState !== 'reveal') {
            const { host, guest } = gameData.playerGuesses;
            // Ensure we haven't already processed this round
            if (revealProcessed.current === gameData.currentRound) return;

            const isSolo = mode === 'solo';
            const readyToReveal = isSolo ? !!host : (host && guest);

            if (readyToReveal) {
                revealProcessed.current = gameData.currentRound; // Lock it

                // Update scores
                const newHostScore = (gameData.scores?.host || 0) + (host?.scoreDelta || 0);
                // Guest score stays same in solo or updates in multi
                const newGuestScore = (gameData.scores?.guest || 0) + (guest?.scoreDelta || 0);

                update(ref(db, `rooms/${id}`), {
                    gameState: 'reveal',
                    scores: {
                        host: newHostScore,
                        guest: newGuestScore
                    }
                });
            }
        }
    }, [gameData?.playerGuesses, isHost, gameData?.currentRound, mode]);

    // Host Logic: Next Round
    const handleNextRoundVote = async () => {
        await update(ref(db, `rooms/${id}/nextRoundVotes/${role}`), { ready: true });
    };

    useEffect(() => {
        if (isHost === 'true' && gameData?.nextRoundVotes) {
            const { host, guest } = gameData.nextRoundVotes;
            const isSolo = mode === 'solo';

            // In Solo, only host needs to be ready. In multi, either (or usually both, but logic here says If ANYONE).
            if (host?.ready || (!isSolo && guest?.ready)) {
                // Advance round
                const nextRound = (gameData.currentRound || 0) + 1;

                // Check Game Over
                if (nextRound >= 5) {
                    update(ref(db, `rooms/${id}`), { gameState: 'gameOver' });
                    return;
                }

                // Reset for next round
                update(ref(db, `rooms/${id}`), {
                    currentRound: nextRound,
                    gameState: 'preview',
                    playerGuesses: null,
                    nextRoundVotes: null
                });
            }
        }
    }, [gameData?.nextRoundVotes, isHost, mode]);


    if (!gameData || !currentSong) {
        return (
            <View style={styles.container}>
                <BackgroundGradient />
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ color: Colors.text, marginTop: 20 }}>Loading Game...</Text>
            </View>
        );
    }

    if (gameData.gameState === 'gameOver') {
        const myScore = gameData.scores?.[role] || 0;
        const oppScore = gameData.scores?.[opponentRole] || 0;
        let result = "DRAW";
        if (myScore > oppScore) result = "VICTORY";
        if (myScore < oppScore) result = "DEFEAT";

        if (mode === 'solo') result = "SOLO RUN";

        return (
            <View style={styles.container}>
                <BackgroundGradient />
                <View style={styles.centerContent}>
                    <Text style={styles.gameOverTitle}>{result}</Text>
                    <Text style={styles.finalScore}>Final Score: {myScore}</Text>
                    <Text style={styles.finalScoreOpp}>Opponent: {oppScore}</Text>
                    <GlassButton title="Return to Lobby" onPress={() => router.replace('/')} style={{ marginTop: 50, marginBottom: 20 }} />
                    <View style={styles.adContainer}>
                        <BannerAd
                            unitId={TestIds.BANNER}
                            size={BannerAdSize.MEDIUM_RECTANGLE}
                            requestOptions={{
                                requestNonPersonalizedAdsOnly: true,
                            }}
                        />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <BackgroundGradient />

            {/* Header: Scores & Timer */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.playerLabel}>YOU</Text>
                    <ScoreTicker score={gameData.scores?.[role] || 0} style={styles.score} />
                    {isReveal && gameData.playerGuesses?.[role]?.scoreDelta > 0 && (
                        <Animated.Text entering={FadeInUp} style={styles.miniDelta}>
                            +{gameData.playerGuesses?.[role]?.scoreDelta}
                        </Animated.Text>
                    )}
                </View>
                <View style={styles.timerContainer}>
                    <Text style={styles.timer}>{timeRemaining}</Text>
                </View>
                <View>
                    <Text style={[styles.playerLabel, { textAlign: 'right' }]}>OPPONENT</Text>
                    <ScoreTicker score={gameData.scores?.[opponentRole] || 0} style={styles.score} />
                    {isReveal && gameData.playerGuesses?.[opponentRole]?.scoreDelta > 0 && (
                        <Animated.Text entering={FadeInUp} style={[styles.miniDelta, { textAlign: 'right' }]}>
                            +{gameData.playerGuesses?.[opponentRole]?.scoreDelta}
                        </Animated.Text>
                    )}
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.content}>

                {isReveal ? (
                    <Animated.View entering={FadeInUp.springify()} style={styles.revealContainer}>
                        <Image
                            source={{ uri: currentSong.artworkUrl100 }}
                            style={styles.artwork}
                        />
                        <Text style={styles.songTitle}>{currentSong.trackName}</Text>
                        <Text style={styles.artistName}>{currentSong.artistName}</Text>

                        <Animated.Text entering={ZoomIn.delay(300)} style={[styles.deltaScore, { color: localScoreDelta > 0 ? Colors.success : Colors.error }]}>
                            {localScoreDelta > 0 ? `+${localScoreDelta}` : "MISS"}
                        </Animated.Text>

                        <GlassButton
                            title={"Next Song"}
                            onPress={handleNextRoundVote}
                            style={{ marginTop: 40, width: 200 }}
                        />
                    </Animated.View>
                ) : (
                    <View style={styles.gameplayContainer}>
                        {/* Manual Music Player */}
                        <GlassButton
                            title={isPlaying ? "PAUSE MUSIC" : "PLAY MUSIC"}
                            onPress={toggleMusic}
                            style={{ marginBottom: 30, width: 160 }}
                        />

                        {hasGuessed ? (
                            <Animated.View entering={FadeIn} style={styles.waitingContainer}>
                                <ActivityIndicator size="large" color={Colors.primary} />
                                <Text style={styles.waitingText}>Waiting for opponent...</Text>
                            </Animated.View>
                        ) : (
                            <View style={styles.optionsGrid}>
                                <View style={styles.row}>
                                    {currentSong.options?.slice(0, 2).map((option: any, idx: number) => (
                                        <SongCard
                                            key={idx}
                                            title={option.trackName}
                                            artwork={option.artworkUrl100}
                                            onPress={() => handleGuess(option.trackName)}
                                            disabled={hasGuessed}
                                        />
                                    ))}
                                </View>
                                <View style={styles.row}>
                                    {currentSong.options?.slice(2, 4).map((option: any, idx: number) => (
                                        <SongCard
                                            key={idx + 2}
                                            title={option.trackName}
                                            artwork={option.artworkUrl100}
                                            onPress={() => handleGuess(option.trackName)}
                                            disabled={hasGuessed}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    playerLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: 'bold' },
    score: { color: Colors.text, fontSize: 24, fontWeight: '900' },
    timerContainer: {
        width: 60, height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)'
    },
    timer: { color: Colors.primary, fontSize: 24, fontWeight: 'bold' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Gameplay
    gameplayContainer: { width: '100%', alignItems: 'center', flex: 1, justifyContent: 'center' },
    visualizer: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', height: 100, marginBottom: 50 },
    bar: { width: 10, backgroundColor: Colors.primary, borderRadius: 5 },
    optionsGrid: {
        width: '100%',
        gap: 12,
        flex: 1, // Take available space
        justifyContent: 'center'
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        height: '45%' // Roughly half height
    },
    optionWrapper: {
        width: '100%',
    },

    // Waiting
    waitingContainer: { alignItems: 'center', gap: 20 },
    waitingText: { color: Colors.text, fontSize: 18, opacity: 0.8 },

    // Reveal
    revealContainer: { alignItems: 'center', width: '100%' },
    artwork: { width: 280, height: 280, borderRadius: 20, marginBottom: 30, borderWidth: 2, borderColor: Colors.surfaceHighlight },
    songTitle: { color: Colors.text, fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, paddingHorizontal: 20 },
    artistName: { color: Colors.primary, fontSize: 20, marginBottom: 30 },
    deltaScore: { fontSize: 48, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 },

    // Game Over
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    gameOverTitle: { fontSize: 50, color: Colors.primary, fontWeight: '900', marginBottom: 40 },
    finalScore: { fontSize: 30, color: Colors.text, marginBottom: 10 },
    finalScoreOpp: { fontSize: 20, color: Colors.textSecondary },
    miniDelta: { color: Colors.success, fontSize: 14, fontWeight: 'bold', marginTop: 4 },
    adContainer: {
        marginTop: 20,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center'
    }
});

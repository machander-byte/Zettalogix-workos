'use client';

import { useEffect, useRef, useState } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
import { CallSessionState } from './useCallSignaling';

const STUN_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];
const TURN_URL = process.env.NEXT_PUBLIC_TURN_URL;
const TURN_USER = process.env.NEXT_PUBLIC_TURN_USER;
const TURN_PASS = process.env.NEXT_PUBLIC_TURN_PASS;
const ICE_SERVERS = TURN_URL
  ? [
      ...STUN_SERVERS,
      {
        urls: TURN_URL,
        username: TURN_USER,
        credential: TURN_PASS
      }
    ]
  : STUN_SERVERS;

type WebRTCState = 'idle' | 'connecting' | 'in_call' | 'error';

export const useWebRTCAudio = (call: CallSessionState | null, userId?: string) => {
  const socket = useSocketStore((state) => state.socket);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<WebRTCState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);

  const cleanup = () => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setState('idle');
    setError(null);
    setMuted(false);
    setCameraOff(false);
    setHasVideo(false);
  };

  useEffect(() => cleanup, []);

  useEffect(() => {
    if (!call) {
      cleanup();
      return;
    }
    if (call.status === 'accepted') {
      setState('connecting');
    }
  }, [call]);

  useEffect(() => {
    if (!socket) return;

    const handleOffer = async (payload: { callId: string; sdp: RTCSessionDescriptionInit }) => {
      if (!call || payload.callId !== call.callId) return;
      try {
        const pc = await ensurePeerConnection(false);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:answer', { callId: call.callId, sdp: pc.localDescription });
      } catch (err) {
        setError('Failed to handle offer');
      }
    };

    const handleAnswer = async (payload: { callId: string; sdp: RTCSessionDescriptionInit }) => {
      if (!call || payload.callId !== call.callId) return;
      try {
        await pcRef.current?.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      } catch (err) {
        setError('Failed to set remote answer');
      }
    };

    const handleIce = async (payload: { callId: string; candidate: RTCIceCandidateInit }) => {
      if (!call || payload.callId !== call.callId) return;
      try {
        await pcRef.current?.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err) {
        setError('Failed to add ICE candidate');
      }
    };

    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice', handleIce);

    return () => {
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice', handleIce);
    };
  }, [socket, call]);

  const attachStreams = () => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    if (remoteStreamRef.current) {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStreamRef.current;
    }
  };

  const ensurePeerConnection = async (isCaller: boolean) => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && call && socket) {
        socket.emit('webrtc:ice', { callId: call.callId, candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setState('in_call');
      } else if (pc.connectionState === 'failed') {
        setState('error');
      }
    };

    pc.ontrack = (event) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }
      remoteStreamRef.current.addTrack(event.track);
      attachStreams();
    };

    try {
      if (!localStreamRef.current) {
        const wantsVideo = call?.type === 'video';
        try {
          localStreamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: wantsVideo
          });
          setHasVideo(wantsVideo);
        } catch (videoErr) {
          if (wantsVideo) {
            setError('Camera unavailable; continuing with audio only');
          }
          localStreamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          });
          setHasVideo(false);
        }
      }
    } catch (err) {
      setError('Microphone permission denied or unavailable');
      setState('error');
      return pc;
    }

    localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));
    attachStreams();

    if (isCaller && call && socket) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc:offer', { callId: call.callId, sdp: pc.localDescription });
    }

    return pc;
  };

  useEffect(() => {
    const start = async () => {
      if (!call || call.status !== 'accepted' || !socket || !userId) return;
      const isCaller = call.from === userId;
      await ensurePeerConnection(isCaller);
    };
    start();
  }, [call, socket, userId]);

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = stream.getAudioTracks().every((t) => t.enabled);
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !enabled;
    });
    setMuted(enabled);
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const tracks = stream.getVideoTracks();
    if (!tracks.length) return;
    const enabled = tracks.every((t) => t.enabled);
    tracks.forEach((t) => {
      t.enabled = !enabled;
    });
    setCameraOff(enabled);
  };

  return {
    remoteAudioRef,
    remoteVideoRef,
    localVideoRef,
    state,
    error,
    muted,
    cameraOff,
    hasVideo,
    toggleMute,
    toggleCamera,
    cleanup
  };
};

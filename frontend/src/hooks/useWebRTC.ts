import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "./useSocket";
import {
  type CallType,
  type CallStatus,
  type CallSignaling,
} from "../../../shared/types";

interface UseWebRTCProps {
  callId?: string;
  isInitiator: boolean;
  callType: CallType;
  onCallStatusChange: (status: CallStatus) => void;
  onRemoteStream: (stream: MediaStream) => void;
}

export const useWebRTC = ({
  callId,
  isInitiator,
  callType,
  onCallStatusChange,
  onRemoteStream,
}: UseWebRTCProps) => {
  const { sendCallSignal, onCallSignal } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    if (!callId) return;

    // WebRTC configuration with STUN servers
    const rtcConfig: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };
    peerConnection.current = new RTCPeerConnection(rtcConfig);

    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate:", event.candidate);
        const signaling: CallSignaling = {
          type: "ice-candidate",
          data: event.candidate,
          callId,
          from: "", // Will be set by the server
          to: "", // Will be set by the server
        };
        sendCallSignal(signaling);
      }
    };

    // Handle remote stream
    peerConnection.current.ontrack = (event) => {
      console.log("Received remote stream:", event.streams);
      const [remoteStream] = event.streams;
      onRemoteStream(remoteStream);
    };

    // Handle connection state changes
    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current?.connectionState;
      console.log(`WebRTC connection state: ${state}`);

      if (state === "connected") {
        setIsConnected(true);
        console.log("WebRTC connection established successfully");
      } else if (
        state === "disconnected" ||
        state === "failed" ||
        state === "closed"
      ) {
        setIsConnected(false);
        if (state === "failed") {
          console.error("WebRTC connection failed");
          onCallStatusChange("failed");
        }
      }
    };
    return peerConnection.current;
  }, [sendCallSignal, callId, onCallStatusChange, onRemoteStream]);

  // Get user media
  const getUserMedia = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === "video",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      throw error;
    }
  }, [callType]); // Create offer (for call initiator)
  const createOffer = useCallback(async () => {
    if (!peerConnection.current || !callId) return;

    try {
      console.log("Creating WebRTC offer...");
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      const signaling: CallSignaling = {
        type: "offer",
        data: offer,
        callId,
        from: "", // Will be set by the server
        to: "", // Will be set by the server
      };
      console.log("Sending offer:", signaling);
      sendCallSignal(signaling);
    } catch (error) {
      console.error("Error creating offer:", error);
      onCallStatusChange("failed");
    }
  }, [sendCallSignal, callId, onCallStatusChange]);
  // Create answer (for call receiver)
  const createAnswer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      if (!peerConnection.current || !callId) return;

      try {
        console.log("Creating WebRTC answer for offer:", offer);
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        const signaling: CallSignaling = {
          type: "answer",
          data: answer,
          callId,
          from: "", // Will be set by the server
          to: "", // Will be set by the server
        };
        console.log("Sending answer:", signaling);
        sendCallSignal(signaling);
      } catch (error) {
        console.error("Error creating answer:", error);
        onCallStatusChange("failed");
      }
    },
    [sendCallSignal, callId, onCallStatusChange]
  );
  // Handle incoming signaling
  const handleSignaling = useCallback(
    async (signaling: CallSignaling) => {
      if (!peerConnection.current || signaling.callId !== callId) return;

      try {
        console.log("Handling signaling:", signaling.type, signaling);
        switch (signaling.type) {
          case "offer":
            await createAnswer(signaling.data);
            break;

          case "answer":
            console.log(
              "Setting remote description with answer:",
              signaling.data
            );
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(signaling.data)
            );
            break;

          case "ice-candidate":
            console.log("Adding ICE candidate:", signaling.data);
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(signaling.data)
            );
            break;
        }
      } catch (error) {
        console.error("Error handling signaling:", error);
        onCallStatusChange("failed");
      }
    },
    [callId, createAnswer, onCallStatusChange]
  );

  // Initialize call
  const initializeCall = useCallback(async () => {
    try {
      const stream = await getUserMedia();
      const pc = initializePeerConnection();

      if (pc && stream) {
        // Add local stream to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // If initiator, create offer
        if (isInitiator) {
          await createOffer();
        }
      }
    } catch (error) {
      console.error("Error initializing call:", error);
      onCallStatusChange("failed");
    }
  }, [
    getUserMedia,
    initializePeerConnection,
    isInitiator,
    createOffer,
    onCallStatusChange,
  ]);

  // End call
  const endCall = useCallback(() => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    setIsConnected(false);
  }, [localStream]);
  // Socket event listeners
  useEffect(() => {
    onCallSignal(handleSignaling);
  }, [onCallSignal, handleSignaling]);

  return {
    localStream,
    isConnected,
    initializeCall,
    endCall,
  };
};

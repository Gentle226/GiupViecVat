import { useState, useCallback, useEffect, useRef } from "react";
import { useSocket } from "./useSocket";
import { useWebRTC } from "./useWebRTC";
import {
  type Call,
  type CallStatus,
  type CallType,
} from "../../../shared/types";

export const useCall = () => {
  const {
    initiateCall,
    answerCall,
    declineCall,
    endCall,
    onIncomingCall,
    onCallInitiated,
    onCallStatusUpdate,
  } = useSocket();

  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>("pending");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [duration, setDuration] = useState(0);
  const [isIncoming, setIsIncoming] = useState(false);

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    localStream,
    isConnected,
    initializeCall,
    endCall: endWebRTCCall,
  } = useWebRTC({
    callId: currentCall?._id,
    isInitiator: !isIncoming,
    callType: currentCall?.callType || "voice",
    onCallStatusChange: setCallStatus,
    onRemoteStream: setRemoteStream,
  });

  // Start duration timer
  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    setDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  // Stop duration timer
  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);
  // Start call
  const startCall = useCallback(
    async (receiverId: string, callType: CallType, conversationId: string) => {
      try {
        setIsIncoming(false);
        setCallStatus("pending");

        // Reset current call - we'll get the real call from call:initiated event
        setCurrentCall(null);

        // Initiate the call - this will trigger call:initiated event with real call ID
        initiateCall(receiverId, callType, conversationId);

        // Don't initialize WebRTC here - wait for call:initiated event
        console.log(
          "Call initiation request sent, waiting for call:initiated event"
        );
      } catch (error) {
        console.error("Error starting call:", error);
        setCallStatus("failed");
      }
    },
    [initiateCall]
  );
  // Answer incoming call
  const handleAnswerCall = useCallback(async () => {
    if (!currentCall) return;

    try {
      console.log("Answering call:", currentCall._id);
      setCallStatus("answered");
      answerCall(currentCall._id);

      // Initialize WebRTC after answering
      await initializeCall();

      console.log("Call answered and WebRTC initialized");
    } catch (error) {
      console.error("Error answering call:", error);
      setCallStatus("failed");
    }
  }, [currentCall, answerCall, initializeCall]);
  // Decline call
  const handleDeclineCall = useCallback(() => {
    if (!currentCall) return;

    setCallStatus("declined");
    declineCall(currentCall._id);

    // End call logic
    endWebRTCCall();
    stopDurationTimer();
    setCurrentCall(null);
    setCallStatus("pending");
    setRemoteStream(null);
    setDuration(0);
    setIsIncoming(false);
  }, [currentCall, declineCall, endWebRTCCall, stopDurationTimer]);

  // End call
  const handleEndCall = useCallback(() => {
    if (currentCall) {
      endCall(currentCall._id);
    }

    endWebRTCCall();
    stopDurationTimer();
    setCurrentCall(null);
    setCallStatus("pending");
    setRemoteStream(null);
    setDuration(0);
    setIsIncoming(false);
  }, [currentCall, endCall, endWebRTCCall, stopDurationTimer]);
  // Handle incoming call
  useEffect(() => {
    onIncomingCall((call: Call) => {
      setCurrentCall(call);
      setCallStatus("ringing");
      setIsIncoming(true);
    });
  }, [onIncomingCall]);
  // Handle call initiated (for the caller)
  useEffect(() => {
    onCallInitiated(
      async ({ call, status }: { call: Call; status: string }) => {
        console.log("Call initiated response received:", call._id, status);
        // Update the current call with the real call object from backend
        setCurrentCall(call);
        setCallStatus(status as CallStatus);

        // Initialize WebRTC for the caller after receiving the real call ID
        try {
          await initializeCall();
          console.log("WebRTC initialized for caller");
        } catch (error) {
          console.error("Error initializing WebRTC for caller:", error);
          setCallStatus("failed");
        }
      }
    );
  }, [onCallInitiated, initializeCall]); // Handle call status updates
  useEffect(() => {
    onCallStatusUpdate(
      ({ callId, status }: { callId: string; status: string }) => {
        console.log("Call status update received:", callId, status);
        if (currentCall && currentCall._id === callId) {
          setCallStatus(status as CallStatus);

          if (
            status === "ended" ||
            status === "declined" ||
            status === "failed"
          ) {
            console.log("Call ended, status:", status);
            handleEndCall();
          }
        }
      }
    );
  }, [onCallStatusUpdate, currentCall, handleEndCall]);

  // Start duration timer when WebRTC connection is established
  useEffect(() => {
    if (isConnected && callStatus === "answered") {
      console.log(
        "WebRTC connected and call answered, starting duration timer"
      );
      startDurationTimer();
    } else if (!isConnected) {
      console.log("WebRTC disconnected, stopping duration timer");
      stopDurationTimer();
    }
  }, [isConnected, callStatus, startDurationTimer, stopDurationTimer]);
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDurationTimer();
      if (currentCall) {
        endWebRTCCall();
      }
    };
  }, [currentCall, endWebRTCCall, stopDurationTimer]);

  return {
    currentCall,
    callStatus,
    localStream,
    remoteStream,
    duration,
    isIncoming,
    isConnected,
    startCall,
    answerCall: handleAnswerCall,
    declineCall: handleDeclineCall,
    endCall: handleEndCall,
  };
};

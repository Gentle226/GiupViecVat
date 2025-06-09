import React from "react";
import { CallModal } from "./CallModal";
import { useCall } from "../hooks/useCall";
import { useAuth } from "../contexts/AuthContext";

export const CallHandler: React.FC = () => {
  const { user } = useAuth();
  const {
    currentCall,
    callStatus,
    localStream,
    remoteStream,
    duration,
    isIncoming,
    answerCall,
    declineCall,
    endCall,
  } = useCall();

  if (!currentCall) return null;

  // Determine the other participant
  const isCurrentUserCaller = currentCall.callerId === user?._id;
  const otherParticipantId = isCurrentUserCaller
    ? currentCall.receiverId
    : currentCall.callerId;

  // In a real app, you would fetch participant details from your user store/context
  const participantName = `User ${otherParticipantId.substring(0, 8)}`;

  return (
    <CallModal
      isOpen={true}
      callType={currentCall.callType}
      status={callStatus}
      participantName={participantName}
      isIncoming={isIncoming}
      onAnswer={answerCall}
      onDecline={declineCall}
      onEndCall={endCall}
      localStream={localStream || undefined}
      remoteStream={remoteStream || undefined}
      duration={duration}
    />
  );
};

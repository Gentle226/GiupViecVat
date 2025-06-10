import React, { useEffect, useRef, useState } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Speaker,
  Volume2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { CallType, CallStatus } from "../../../shared/types";

interface CallModalProps {
  isOpen: boolean;
  callType: CallType;
  status: CallStatus;
  participantName: string;
  participantAvatar?: string;
  isIncoming?: boolean;
  onAnswer?: () => void;
  onDecline?: () => void;
  onEndCall: () => void;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  duration?: number;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  callType,
  status,
  participantName,
  participantAvatar,
  isIncoming = false,
  onAnswer,
  onDecline,
  onEndCall,
  localStream,
  remoteStream,
  duration = 0,
}) => {
  const { t } = useTranslation();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === "video") {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // Note: Actual speaker control would need Web Audio API or browser-specific implementation
  };

  if (!isOpen) return null;

  const getStatusText = () => {
    switch (status) {
      case "pending":
      case "ringing":
        return isIncoming ? t("messages.incomingCall") : t("messages.calling");
      case "answered":
        return formatDuration(duration);
      case "ended":
        return t("messages.callEnded");
      case "missed":
        return t("messages.callMissed");
      case "declined":
        return t("messages.callEnded");
      case "failed":
        return t("messages.callFailed");
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Call Header */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <div className="flex flex-col items-center space-y-2">
            {participantAvatar ? (
              <img
                src={participantAvatar}
                alt={participantName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-xl font-semibold text-gray-600">
                  {participantName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {participantName}
            </h3>
            <p className="text-sm text-gray-500">
              {callType === "video"
                ? t("messages.videoCall")
                : t("messages.voiceCall")}
            </p>
            <p className="text-sm font-medium text-gray-700">
              {getStatusText()}
            </p>
          </div>
        </div>

        {/* Video Container */}
        {callType === "video" && status === "answered" && (
          <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Local Video */}
            <div className="absolute top-4 right-4 w-24 h-18 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="px-6 py-4">
          <div className="flex justify-center space-x-4">
            {/* Incoming Call Controls */}
            {isIncoming && (status === "pending" || status === "ringing") && (
              <>
                <button
                  onClick={onDecline}
                  className="flex items-center justify-center w-12 h-12 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <button
                  onClick={onAnswer}
                  className="flex items-center justify-center w-12 h-12 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                >
                  <Phone className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Active Call Controls */}
            {status === "answered" && (
              <>
                <button
                  onClick={toggleMute}
                  className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                    isMuted
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {isMuted ? (
                    <MicOff className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </button>

                {callType === "video" && (
                  <button
                    onClick={toggleVideo}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                      isVideoOff
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {isVideoOff ? (
                      <VideoOff className="w-6 h-6" />
                    ) : (
                      <Video className="w-6 h-6" />
                    )}
                  </button>
                )}

                <button
                  onClick={toggleSpeaker}
                  className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                    isSpeakerOn
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {" "}
                  {isSpeakerOn ? (
                    <Speaker className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </button>

                <button
                  onClick={onEndCall}
                  className="flex items-center justify-center w-12 h-12 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </>
            )}

            {/* End Call Button for other statuses */}
            {(status === "ended" ||
              status === "failed" ||
              status === "missed" ||
              status === "declined") && (
              <button
                onClick={onEndCall}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

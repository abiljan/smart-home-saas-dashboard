import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MessageCircle, AlertTriangle, Lightbulb, Send, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Device {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  roomLocation?: string;
  status: string;
}

interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  confidence?: number;
  sources?: string[];
  followUpSuggestions?: string[];
  rating?: number;
  createdAt: string;
}

export default function GuestPage() {
  const [location] = useLocation();
  const homeId = location.split('/')[2]; // Extract homeId from /homes/:homeId/guest
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [question, setQuestion] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');

  const { data: home } = useQuery({
    queryKey: [`/api/homes/${homeId}`],
  });

  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: [`/api/homes/${homeId}/devices`],
  });

  const { data: chatHistory = [] } = useQuery<ChatMessage[]>({
    queryKey: [`/api/homes/${homeId}/chat-history`],
  });

  const askMutation = useMutation({
    mutationFn: (data: { question: string; context: any }) =>
      apiRequest(`/api/homes/${homeId}/ask`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      setQuestion('');
      queryClient.invalidateQueries({ queryKey: [`/api/homes/${homeId}/chat-history`] });
      toast({
        title: "Question Answered",
        description: "I've provided an answer based on the available device information.",
      });
    }
  });

  const rateMutation = useMutation({
    mutationFn: ({ messageId, rating }: { messageId: string; rating: number }) =>
      apiRequest(`/api/chat/${messageId}/rate`, {
        method: 'PATCH',
        body: JSON.stringify({ rating }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/homes/${homeId}/chat-history`] });
    }
  });

  const rooms = [...new Set(devices.map(d => d.roomLocation).filter(Boolean))];
  const filteredDevices = selectedRoom 
    ? devices.filter(d => d.roomLocation === selectedRoom)
    : devices;

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const context = {
      room: selectedRoom,
      devices: filteredDevices.map(d => d.name),
      deviceDetails: filteredDevices.map(d => ({
        name: d.name,
        manufacturer: d.manufacturer,
        model: d.model,
        status: d.status
      }))
    };

    askMutation.mutate({ question, context });
  };

  const handleQuickQuestion = (quickQuestion: string) => {
    const context = {
      room: selectedRoom,
      devices: filteredDevices.map(d => d.name),
      deviceDetails: filteredDevices.map(d => ({
        name: d.name,
        manufacturer: d.manufacturer,
        model: d.model,
        status: d.status
      }))
    };

    askMutation.mutate({ question: quickQuestion, context });
  };

  const handleRating = (messageId: string, rating: number) => {
    rateMutation.mutate({ messageId, rating });
  };

  return (
    <div className="min-h-screen bg-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/homes/${homeId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-blue-800">Guest Assistant</h1>
              <p className="text-blue-600">Welcome to {home?.name}</p>
            </div>
          </div>
          
          <Link href={`/homes/${homeId}/emergency`}>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Emergency Help
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Browser */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Smart Home Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Room Filter */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-blue-700 mb-2 block">
                    Filter by Room:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedRoom === '' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedRoom('')}
                    >
                      All Rooms
                    </Button>
                    {rooms.map(room => (
                      <Button
                        key={room}
                        variant={selectedRoom === room ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedRoom(room)}
                      >
                        {room}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Device List */}
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {filteredDevices.map(device => (
                      <div key={device.id} className="p-3 bg-blue-100 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-blue-800">{device.name}</h4>
                          <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                            {device.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-blue-600">
                          {device.manufacturer} {device.model}
                        </p>
                        <p className="text-xs text-blue-500">
                          Location: {device.roomLocation || 'Unknown'}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Quick Questions */}
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-blue-700">Quick Questions:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickQuestion(`How do I turn on the ${selectedRoom ? selectedRoom + ' ' : ''}TV?`)}
                      disabled={askMutation.isPending}
                    >
                      How to turn on TV?
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickQuestion(`How do I adjust the ${selectedRoom ? selectedRoom + ' ' : ''}temperature?`)}
                      disabled={askMutation.isPending}
                    >
                      Adjust temperature?
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickQuestion(`What voice commands work ${selectedRoom ? 'in the ' + selectedRoom : 'here'}?`)}
                      disabled={askMutation.isPending}
                    >
                      Voice commands?
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Chat Assistant */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Ask a Question
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAskQuestion} className="space-y-3">
                  <Input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="How do I use the living room TV?"
                    className="border-blue-200"
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!question.trim() || askMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {askMutation.isPending ? 'Getting Answer...' : 'Ask Question'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Chat History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-800">Recent Answers</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {chatHistory.map((message) => (
                      <div key={message.id} className="p-3 bg-blue-100 rounded-lg">
                        <div className="font-medium text-blue-800 mb-2">
                          Q: {message.question}
                        </div>
                        <div className="text-blue-700 mb-3">
                          A: {message.answer}
                        </div>
                        
                        {message.confidence && (
                          <div className="text-xs text-blue-500 mb-2">
                            Confidence: {Math.round(message.confidence * 100)}%
                          </div>
                        )}

                        {message.sources && message.sources.length > 0 && (
                          <div className="text-xs text-blue-500 mb-2">
                            Sources: {message.sources.join(', ')}
                          </div>
                        )}

                        {message.followUpSuggestions && message.followUpSuggestions.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs text-blue-600 mb-1">Related questions:</div>
                            <div className="flex flex-wrap gap-1">
                              {message.followUpSuggestions.map((suggestion, idx) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleQuickQuestion(suggestion)}
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rating */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-blue-600">Rate this answer:</span>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => handleRating(message.id, rating)}
                              className={`text-sm ${
                                message.rating && message.rating >= rating
                                  ? 'text-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            >
                              <Star className="h-3 w-3" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
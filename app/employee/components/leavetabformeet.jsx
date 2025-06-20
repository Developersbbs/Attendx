import { useEffect, useState } from "react";
import { db } from "@/app/firebase/config";
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 as PageLoader } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Hourglass, CheckCircle } from "lucide-react";

export default function LeaveTabForMeet({ user }) {
  const [meetings, setMeetings] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  useEffect(() => {
    const fetchMeetings = async () => {
      if (!user) return;
      try {
        const phone = user.phoneNumber.slice(3);
        const userQuery = query(collection(db, "users"), where("phone", "==", phone));
        const userSnapshot = await getDocs(userQuery);
        if (userSnapshot.empty) return;
        const userData = userSnapshot.docs[0].data();
        const adminUid = userData.adminuid;
        const employeeUid = userData.uid;
        const today = format(new Date(), "yyyy-MM-dd");
        const meetingsQuery = query(
          collection(db, "Meetings"),
          where("adminUid", "==", adminUid),
          where("meetingDate", "==", today)
        );
        const meetingsSnapshot = await getDocs(meetingsQuery);
        const meetingsList = meetingsSnapshot.docs
          .map(doc => {
            const data = doc.data();
            const isAttendee = (data.attendees || []).some(a => a.id === employeeUid);
            if (isAttendee) {
              return {
                id: doc.id,
                ...data,
              };
            }
            return null;
          })
          .filter(Boolean);
        setMeetings(meetingsList);


        const leaveRequestsQuery = query(
          collection(db, "leaves"),
          where("employeeuid", "==", user.uid)
        );
        const leaveRequestsSnapshot = await getDocs(leaveRequestsQuery);
        const leaveRequestsList = leaveRequestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLeaveRequests(leaveRequestsList);
      } catch (err) {
        setMeetings([]);
      }
    };
    fetchMeetings();
  }, [user]);


  console.log(leaveRequests);

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !selectedMeeting) return;
    setLoading(true);
    try {
      await setDoc(doc(collection(db, "leaves")), {
        meetingId: selectedMeeting.id,
        meetingTitle: selectedMeeting.meetingTitle,
        meetingDate: selectedMeeting.meetingDate,
        meetingTime: selectedMeeting.meetingTime,
        employeeuid: user.uid,
        adminuid: selectedMeeting.adminUid,
        reason,
        status: "Pending",
        createdAt: new Date(),
      });
      sonnerToast.success("Leave request submitted", {
        description: `Leave request for '${selectedMeeting.meetingTitle}' submitted successfully!`,
      });
      setIsDialogOpen(false);
      setReason("");
      setSelectedMeeting(null);
    } catch (error) {
      sonnerToast.error("Failed to submit leave request", {
        description: error.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Today's Meetings</CardTitle>
          <CardDescription>
            Apply for leave for a specific meeting below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <p className="text-muted-foreground">No meetings scheduled for you today.</p>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <Card key={meeting.id} className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{meeting.meetingTitle}</p>
                      <p className="text-xs text-muted-foreground">Date: {format(new Date(meeting.meetingDate), "MMM dd, yyyy")} - Time: {meeting.meetingTime}</p>
                    </div>

                    {leaveRequests.find(leave => leave.meetingId === meeting.id && leave.status === "Approved") ? (
                      <Badge variant="outline" className="text-xs whitespace-nowrap bg-green-500 text-white">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Approved
                      </Badge>
                    ) : leaveRequests.find(leave => leave.meetingId === meeting.id && leave.status === "Pending") ? (
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        <Hourglass className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                    ) : (
                      <Button
                      size="sm"
                      variant="secondary"
                      className="bg-blue-500 text-white hover:bg-blue-600"
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        setIsDialogOpen(true);
                      }}
                    >
                      Apply for Leave
                    </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>
              {selectedMeeting && (
                <>
                  <div className="font-medium">Meeting: {selectedMeeting.meetingTitle}</div>
                  <div className="text-xs text-muted-foreground mb-2">Date: {format(new Date(selectedMeeting.meetingDate), "MMM dd, yyyy")} - Time: {selectedMeeting.meetingTime}</div>
                </>
              )}
              Please provide a reason for your leave request.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLeaveSubmit} className="space-y-4 py-2">
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="leaveReason">Reason</Label>
              <Textarea
                id="leaveReason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Briefly state the reason for your leave"
                required
              />
            </div>
            <DialogFooter className="sm:justify-start pt-2">
              <Button type="submit" disabled={loading || !reason} className="w-full sm:w-auto">
                {loading ? <PageLoader className="mr-2 h-4 w-4 animate-spin" /> : "Submit Leave Request"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto mt-2 sm:mt-0">
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

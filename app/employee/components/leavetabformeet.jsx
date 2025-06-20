import { useEffect, useState } from "react";
import { db } from "@/app/firebase/config";
import { collection, query, where, getDocs, setDoc, doc, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 as PageLoader, Hourglass, CheckCircle, XCircle } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { format } from "date-fns";

export default function LeaveTabForMeet({ user }) {
  const [meetings, setMeetings] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [anotherUser,setAnotherUser] = useState(null);
  const [isAttendance,setIsAttendance] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    if (!user) return;

    const fetchMeetings = async () => {
      try {
        const phone  = user.phoneNumber.slice(3)
       
        const q = query(collection(db, "users"), where("phone", "==", phone));
        const querySnapshot = await getDocs(q);
        const userData = querySnapshot.docs[0].data();
        setAnotherUser(userData);
        const adminuid = userData.adminuid;
        console.log("adminuid",adminuid)
       
        const today = format(new Date(), "yyyy-MM-dd").toString();
        const meetingsQuery = query(
          collection(db, "Meetings"),
          where("adminUid", "==", adminuid),
          where("meetingDate", "==", today)
        );

        
        const meetingsSnapshot = await getDocs(meetingsQuery);
        console.log("meetingsSnapshot",meetingsSnapshot.docs[0].data())
        const meetingsList = meetingsSnapshot.docs
          .map(doc => {
            const data = doc.data();
           
            return {
              id: doc.id,
              ...data,
            };  
           
          })
          .filter(Boolean);

        
        setMeetings(meetingsList);
        fetchLeaveRequests(userData.uid);
        fetchAttendance(userData.uid);
       
      } catch (err) {
        console.error("Error fetching meetings: ", err);
        setMeetings([]);
      }
    };

    fetchMeetings();


    const fetchLeaveRequests = async (employeeuid) => {
      const q = query(collection(db, "leaves"), where("employeeuid", "==", employeeuid));
      console.log("q",q)
      const snapshot = await getDocs(q);
      const leaveRequests = snapshot.docs.map((doc) => doc.data());
      console.log("leaveRequests fetchLeaveRequests",leaveRequests)
      setLeaveRequests(leaveRequests);
    }


    const fetchAttendance = async (employeeuid) => {
      const q = query(collection(db, "attendance"), where("employeeId", "==", employeeuid));
      const snapshot = await getDocs(q);
      const attendance = snapshot.docs.map((doc) => doc.data());
      if(attendance.length > 0){
        setIsAttendance(true);
        setAttendanceRecords(attendance);
      }
    }
    
    

   
  }, [user]);



  console.log("meetings",meetings)
  const getLeaveRequestForMeeting = (meetingId) => {
    return leaveRequests.find(request => request.meetingId === meetingId);
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-700 bg-yellow-100 text-xs whitespace-nowrap"
          >
            <Hourglass className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="default"
            className="bg-green-500 hover:bg-green-600 text-xs whitespace-nowrap text-white"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="text-xs whitespace-nowrap">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !selectedMeeting) return;
    setLoading(true);
    try {
      const newLeaveRequest = {
        meetingId: selectedMeeting.id,
        meetingTitle: selectedMeeting.meetingTitle,
        meetingDate: selectedMeeting.meetingDate,
        meetingTime: selectedMeeting.meetingTime,
        meetingDuration: selectedMeeting.meetingDuration,
        employeeuid: anotherUser.uid,
        adminuid: selectedMeeting.adminUid,
        reason,
        status: "Pending",
        createdAt: new Date(),
      };
      
      await setDoc(doc(collection(db, "leaves")), newLeaveRequest);
      
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
              {meetings.map((meeting) => {
                const leaveRequest = leaveRequests.find(leave => leave.meetingId === meeting.meetingId);
                 console.log("leaveRequest",leaveRequests)
              
                const attended = attendanceRecords.some(a => a.meetingId === meeting.meetingId);
                return (
                  <Card key={meeting.meetingId} className="p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{meeting.meetingTitle}</p>
                        <p className="text-xs text-muted-foreground">Date: {format(new Date(meeting.meetingDate), "MMM dd, yyyy")} - Time: {meeting.meetingTime}</p>
                      </div>
                      
                      {leaveRequest ? (
                        getStatusBadge(leaveRequest.status)
                      ) : attended ? (
                        <Badge variant="outline" className="bg-blue-500 text-white text-xs whitespace-nowrap">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Attended
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
                );
              })}
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

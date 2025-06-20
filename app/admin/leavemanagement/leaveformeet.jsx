import { useEffect, useState } from "react";
import { db } from "@/app/firebase/config";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function LeaveForMeet({user}) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(""); // id of leave being updated

  useEffect(() => {
    const fetchMeetings = async () => {
      setLoading(true);
      try {
        const meetingsSnapshot = await getDocs(collection(db, "leaves"));
        const meetingsList = meetingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMeetings(meetingsList);
      } catch (err) {
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const handleAction = async (id, newStatus) => {
    setActionLoading(id + newStatus);
    try {
      const leaveRef = doc(db, "leaves", id);
      await updateDoc(leaveRef, { status: newStatus });
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
    } catch (err) {
      // Optionally show error toast
    } finally {
      setActionLoading("");
    }
  };

  const getStatusBadge = (status) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-100 text-xs whitespace-nowrap">Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-500 text-white text-xs whitespace-nowrap">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-xs whitespace-nowrap">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 mt-10 mx-10">
      <Card>
        <CardHeader>
          <CardTitle>All Scheduled Meetings</CardTitle>
          <CardDescription>
            List of all meetings with their status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading meetings...</p>
          ) : meetings.length === 0 ? (
            <p className="text-muted-foreground">No meetings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration (hrs)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings.map(meeting => (
                    <TableRow key={meeting.id}>
                      <TableCell>{meeting.meetingTitle}</TableCell>
                      <TableCell>{format(new Date(meeting.meetingDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{meeting.meetingTime}</TableCell>
                      <TableCell>{meeting.meetingDuration}</TableCell>
                      <TableCell>{getStatusBadge(meeting.status)}</TableCell>
                      <TableCell>
                        {meeting.status === "Pending" ? (
                          <div className="flex gap-2">
                            <Button size="sm" disabled={actionLoading === meeting.id+"Approved"} onClick={() => handleAction(meeting.id, "Approved")}>Approve</Button>
                            <Button size="sm" variant="destructive" disabled={actionLoading === meeting.id+"Rejected"} onClick={() => handleAction(meeting.id, "Rejected")}>Reject</Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No actions</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

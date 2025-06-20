import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { format } from "date-fns";
import { db } from "@/app/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth } from "@/app/firebase/config";
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertCircle ,
  Activity,
  Info
} from 'lucide-react';

const WfhHistory = () => {
  const [wfhRequests, setWfhRequests] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const fetchWfhRequests = async () => {
      const user = auth.currentUser;
      const phone = user.phoneNumber.slice(3);
      const userQuery = query(
        collection(db, "users"),
        where("phone", "==", phone)
      );
      const userSnapshot = await getDocs(userQuery);
      const userData = userSnapshot.docs[0].data();
      const adminuid = userData.adminuid;
      const wfhRequests = await getDocs(
        collection(db, "wfh_requests"),
        where("adminuid", "==", adminuid)
      );

      if (wfhRequests.empty) {
        console.log("No WFH Requests Found");
        return;
      }

      const fetchedRequests = wfhRequests.docs.map((doc) => {
        const data = doc.data();
        const startDate = data.startDate;
        const endDate = data.endDate;
        const createdAt = data.createdAt.toDate();

        console.log(startDate, "startDate");
        console.log(endDate, "endDate");
        console.log(createdAt, "createdAt");
        const now = new Date();
        return {
          id: doc.id,
          ...data,
          startDate: startDate ? format(startDate, "dd/MM/yy") : "N/A",
          endDate: endDate ? format(endDate, "dd/MM/yy") : "N/A",
          createdAt: createdAt ? format(createdAt, "dd/MM/yy") : "N/A",
        };
      });
      setWfhRequests(fetchedRequests);
      console.log(fetchedRequests, "fetchedRequests");
    };
    fetchWfhRequests();

    // Responsive check
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  console.log(wfhRequests, "wfhRequests");

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>WFH History</CardTitle>
          <CardDescription>
            <p>Work from Home request history</p>
          </CardDescription>
        </CardHeader>
        {wfhRequests.length === 0 ? (
          <CardContent>
            <div className="text-center p-8 text-muted-foreground">
              <Info className="mx-auto h-8 w-8 mb-2" />
              No Work From Home requests found.
            </div>
          </CardContent>
        ) : (
        <CardContent>
          {isMobile ? (
            // <div className="space-y-3">
            //     {wfhRequests.map((req, index) => (
            //         <Card key={req.id || index} className="p-3 border">
            //             <div className="font-semibold mb-1">Created At: <span className="font-normal">{req.createdAt}</span></div>
            //             <div className="mb-1">Duration: <span className="font-normal">{req.startDate} - {req.endDate}</span></div>
            //             <div className="mb-1">Reason: <span className="font-normal">{req.reason}</span></div>
            //             <div>Status: <span className="font-normal">{req.status}</span></div>
            //         </Card>
            //     ))}
            // </div>

            <div className="space-y-4">
              {wfhRequests.map((req, index) => (
                <Card
                  key={req.id || index}
                  className="p-4 border hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-0 space-y-3 flex justify-between">

                    <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <div className="font-semibold hidden sm:block">Created At:</div>
                      <span className="font-normal text-gray-600">
                        {req.createdAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <div className="font-semibold hidden sm:block">Duration:</div>
                      <span className="font-normal text-gray-600">
                        {req.startDate} - {req.endDate}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-4 w-4 text-purple-500 mt-0.5" />
                      <div className="font-semibold hidden sm:block">Reason:</div>
                      <span className="font-normal text-gray-600 flex-1">
                        {req.reason}
                      </span>
                    </div>

                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 self-start">
                        {req.status.toLowerCase() === "approved" && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {req.status.toLowerCase() === "rejected" && (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        {req.status.toLowerCase() === "pending" && (
                          <AlertCircle className="h-4 w-4 text-yellow-600 " />
                        )}
                        <div className="font-semibold hidden md:block">Status:</div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`capitalize ${
                          req.status.toLowerCase() === "approved"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : req.status.toLowerCase() === "rejected"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : req.status.toLowerCase() === "pending"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : "bg-gray-100 text-gray-800"
                        } self-start`}
                      >
                        {req.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Table>
  <TableHeader>
    <TableRow className="bg-gray-50/50">
      <TableHead className="min-w-[120px] font-semibold">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          Created At
        </div>
      </TableHead>
      <TableHead className="min-w-[140px] font-semibold">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-green-500" />
          Duration
        </div>
      </TableHead>
      <TableHead className="min-w-[200px] font-semibold">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-purple-500" />
          Reason
        </div>
      </TableHead>
      <TableHead className="min-w-[120px] font-semibold">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-orange-500" />
          Status
        </div>
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {wfhRequests.map((req, index) => (
      <TableRow key={req.id || index} className="hover:bg-gray-50/50 transition-colors">
        <TableCell className="font-medium text-gray-700">
          <div className="flex items-center gap-2">
            {req.createdAt}
          </div>
        </TableCell>
        <TableCell className="text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {req.startDate} - {req.endDate}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-sm line-clamp-2">{req.reason}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {req.status.toLowerCase() === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
            {req.status.toLowerCase() === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
            {req.status.toLowerCase() === 'pending' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
            <Badge 
              variant="outline" 
              className={`capitalize text-xs ${
                req.status.toLowerCase() === 'approved' ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' :
                req.status.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200' :
                req.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200' :
                'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {req.status}
            </Badge>
          </div>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
          )}
        </CardContent>
        )}
      </Card>
    </div>
  );
};

export default WfhHistory;

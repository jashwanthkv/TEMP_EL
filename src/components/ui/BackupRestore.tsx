import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Database, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const getLastDayOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const BackupRestore = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backups, setBackups] = useState<{ date: string; size: string; type: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Simulated monthly backup data
    const today = new Date();
    const monthsToShow = 3;
    const mockBackups = Array.from({ length: monthsToShow }).map((_, i) => {
      const date = new Date(today.getFullYear(), today.getMonth() - i + 1, 0); // end of month
      return {
        date: format(date, 'MMMM dd, yyyy'),
        size: `${(2.2 + i * 0.1).toFixed(1)} MB`,
        type: 'Automatic',
      };
    });
    setBackups(mockBackups);
  }, []);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newDate = format(getLastDayOfMonth(new Date()), 'MMMM dd, yyyy');
      setBackups(prev => [
        { date: newDate, size: '2.5 MB', type: 'Manual' },
        ...prev.filter(b => !b.date.includes(format(new Date(), 'MMMM'))),
      ]);
      toast({
        title: 'Backup Created',
        description: 'Monthly timesheet backup has been created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Backup Failed',
        description: 'Failed to create backup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: 'Restore Completed',
        description: 'Database has been restored successfully.',
      });
    } catch (error) {
      toast({
        title: 'Restore Failed',
        description: 'Failed to restore database. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const latestBackup = backups[0]?.date || 'No backups yet';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-card-foreground">Monthly Timesheet Backup</h2>
        <p className="text-muted-foreground mt-1">Automatically backs up at the end of each month</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Backup Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              Create Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Creates a backup of all employee data and monthly timesheet.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 text-green-600" />
              Last backup: {latestBackup}
            </div>
            <Button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isBackingUp ? 'Creating Backup...' : 'Create Monthly Backup'}
            </Button>
          </CardContent>
        </Card>

        {/* Restore Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              Restore Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Restore the database from a saved monthly backup file.
            </p>
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                This will overwrite current data
              </span>
            </div>
            <Button
              onClick={handleRestore}
              disabled={isRestoring}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isRestoring ? 'Restoring...' : 'Choose Backup File'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-600" />
            Recent Monthly Backups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {backups.map((backup, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-md"
              >
                <div>
                  <p className="font-medium text-card-foreground">{backup.date}</p>
                  <p className="text-sm text-muted-foreground">{backup.type} • {backup.size}</p>
                </div>
                <Button
                  variant="outline"
                  className="border-green-600 text-green-700 hover:bg-green-100"
                  size="sm"
                >
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupRestore;

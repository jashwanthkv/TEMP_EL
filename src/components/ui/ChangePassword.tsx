import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ChangePassword = () => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employeeId: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validatePassword = (password: string) => {
    const requirements = [
      { test: password.length >= 8, text: 'At least 8 characters' },
      { test: /[A-Z]/.test(password), text: 'One uppercase letter' },
      { test: /[a-z]/.test(password), text: 'One lowercase letter' },
      { test: /\d/.test(password), text: 'One number' },
      { test: /[!@#$%^&*]/.test(password), text: 'One special character' },
    ];
    return requirements;
  };

  const requirements = validatePassword(formData.newPassword);
  const isValidPassword = requirements.every(req => req.test);
  const passwordsMatch = formData.newPassword === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId) {
      toast({
        title: 'Missing Employee ID',
        description: 'Please enter an employee ID.',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidPassword) {
      toast({
        title: 'Invalid Password',
        description: 'Please ensure your password meets all requirements.',
        variant: 'destructive',
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: "Passwords Don't Match",
        description: 'New password and confirmation must match.',
        variant: 'destructive',
      });
      return;
    }

    setIsChanging(true);
    try {
      // TODO: Replace with API call to update password by employeeId
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: 'Password Changed',
        description: 'Password updated successfully for the employee.',
      });
      setFormData({ employeeId: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update password. Try again.',
        variant: 'destructive',
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-card-foreground">Change Employee Password</h2>
        <p className="text-muted-foreground mt-1">Update password using employee ID</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-brand" />
              Password Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Employee ID */}
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => handleChange('employeeId', e.target.value)}
                required
              />
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleChange('newPassword', e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Requirements */}
              {formData.newPassword && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium text-card-foreground mb-2">Password Requirements:</p>
                  <div className="space-y-1">
                    {requirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className={`h-3 w-3 ${req.test ? 'text-success' : 'text-muted-foreground'}`} />
                        <span className={`text-xs ${req.test ? 'text-success' : 'text-muted-foreground'}`}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={isChanging || !isValidPassword || !passwordsMatch}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isChanging ? 'Updating...' : 'Update Password'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setFormData({ employeeId: '', newPassword: '', confirmPassword: '' })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;

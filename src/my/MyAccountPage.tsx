import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Account } from '@/api';
import api from '@/api';
import CreateAccountForm from '@/components/Account/CreateAccountForm';
import EditAccountForm from '@/components/Account/EditAccountForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Container from '@/components/Shared/Container';
import {
  AtSign,
  CheckCircle,
  Clock,
  Copy,
  Globe,
  Mail,
  Pencil,
  Phone,
  Send,
  Settings,
  User,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { abbreviateWallet } from '@/utils/stringUtils';
import { countryCodeToFlag } from '../utils/countryFlagUtil';

interface AccountPageProps {
  account: Account | null;
  setAccount: (account: Account | null) => void;
}

function AccountPage({ account, setAccount }: AccountPageProps) {
  const { primaryWallet } = useDynamicContext();
  const [isEditing, setIsEditing] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [stats, setStats] = useState<{ total_trades: number; completed_trades: number; cancelled_trades: number; disputed_trades: number; completion_rate: number } | null>(null);

  useEffect(() => {
    if (!account?.id) return;
    api.get(`/accounts/${account.id}/stats`).then(r => setStats(r.data)).catch(() => {});
  }, [account?.id]);

  if (!primaryWallet) {
    return (
      <Container className="max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#eaecef] font-semibold">Account Profile</CardTitle>
            <CardDescription>View and manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Alert className="bg-[#1e2329] border-[#2b3139] rounded-sm">
              <AlertDescription>
                Please connect your wallet to view or create your account.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const handleSaveSuccess = (updatedAccount: Account) => {
    setAccount(updatedAccount);
    setIsEditing(false);
    setUpdateSuccess('Your profile has been updated successfully');

    // Clear success message after 3 seconds
    setTimeout(() => {
      setUpdateSuccess('');
    }, 3000);
  };

  return (
    <Container className="max-w-5xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-[#eaecef] font-semibold">Account Profile</CardTitle>
              <CardDescription>View and manage your account settings</CardDescription>
            </div>

            {account && !isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-[#FF6B00] hover:opacity-90 text-[#0b0e11] font-bold rounded-sm"
                size="sm"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {updateSuccess && (
            <Alert className="mb-6 bg-[#02c076]/10 border border-[#02c076]/30 rounded-sm">
              <CheckCircle className="h-4 w-4 text-secondary-500 mr-2" />
              <AlertDescription className="text-[#02c076]">{updateSuccess}</AlertDescription>
            </Alert>
          )}

          {account ? (
            isEditing ? (
              <EditAccountForm
                account={account}
                onSaveSuccess={handleSaveSuccess}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <ProfileDisplay account={account} />
            )
          ) : (
            <CreateAccountForm setAccount={setAccount} />
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

// Component for displaying user profile information in a modern, responsive layout
function ProfileDisplay({ account }: { account: Account }) {
  return (
    <div className="w-full">
      {/* Mobile view (single column) and Desktop view (two columns) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left column - Profile photo and key info */}
        <div className="md:col-span-4 space-y-6">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center p-4 bg-[#1e2329] rounded-sm border border-[#2b3139]">
            <div className="relative mb-4">
              {account.profile_photo_url ? (
                <img
                  src={account.profile_photo_url}
                  alt="Profile"
                  className="w-32 h-32 rounded-sm object-cover border border-[#2b3139]"
                />
              ) : (
                <div className="w-32 h-32 rounded-sm bg-[#2b3139] flex items-center justify-center">
                  <User className="h-16 w-16 text-primary-400" />
                </div>
              )}
              <div className="absolute bottom-1 right-1 w-4 h-4 rounded-sm bg-[#02c076] border border-[#2b3139]"></div>
            </div>

            {/* Username with flag */}
            <h2 className="text-xl font-semibold text-[#eaecef] mb-1 flex items-center gap-2">
              {account.username || 'Anonymous User'}
              {account.phone_country_code && countryCodeToFlag(account.phone_country_code) && (
                <span>{countryCodeToFlag(account.phone_country_code)}</span>
              )}
            </h2>

            {/* Wallet Address with copy button */}
            <div className="w-full mt-3 mb-2">
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-1 bg-[#2b3139] rounded-sm px-3 py-1.5 w-auto overflow-hidden">
                  <Wallet className="h-4 w-4 text-[#848e9c] flex-shrink-0" />
                  <p className="text-xs font-mono text-[#eaecef] mx-1">
                    {abbreviateWallet(account.wallet_address)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(account.wallet_address);
                      toast.success('Wallet address copied to clipboard');
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center justify-center text-sm text-[#848e9c] mt-2">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              <span>
                Member since{' '}
                {new Date(account.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            {/* Stats */}
            {stats && (
              <div className="flex flex-col items-center mt-4 space-y-1.5">
                <span className="text-sm text-[#eaecef] font-medium">
                  Total Trades: <span className="text-[#FF6B00] font-bold">{stats.total_trades}</span>
                </span>
                <span className="text-sm text-[#eaecef] font-medium">
                  Completed: <span className="text-[#02c076] font-bold">{stats.completed_trades}</span>
                </span>
                <span className="text-sm text-[#eaecef] font-medium">
                  Completion Rate: <span className="text-[#eaecef] font-bold">{stats.completion_rate}%</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Detailed information */}
        <div className="md:col-span-8 space-y-6">
          {/* Contact Information Section */}
          <div className="bg-[#1e2329] rounded-sm border border-[#2b3139] overflow-hidden">
            <div className="px-4 py-3 bg-[#0b0e11] border-b border-[#2b3139]">
              <h3 className="text-sm font-medium text-[#eaecef] flex items-center">
                <Mail className="h-4 w-4 mr-2 text-[#FF6B00]" />
                Contact Information
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Email */}
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-sm bg-[#FF6B00]/10 flex items-center justify-center mr-3 flex-shrink-0">
                  <AtSign className="h-4 w-4 text-[#FF6B00]" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-[#848e9c]">Email</h4>
                  <p className="text-sm text-[#eaecef]">{account.email || '-'}</p>
                </div>
              </div>

              {/* Telegram */}
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-sm bg-[#1A5FA8]/10 flex items-center justify-center mr-3 flex-shrink-0">
                  <Send className="h-4 w-4 text-[#7AB8F5]" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-[#848e9c]">Telegram</h4>
                  <p className="text-sm text-[#eaecef]">
                    {account.telegram_username ? `@${account.telegram_username}` : '-'}
                    {account.telegram_id && (
                      <span className="text-xs text-[#848e9c] ml-2">
                        ID: {account.telegram_id}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-sm bg-[#02c076]/10 flex items-center justify-center mr-3 flex-shrink-0">
                  <Phone className="h-4 w-4 text-[#02c076]" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-[#848e9c]">Phone</h4>
                  <p className="text-sm text-[#eaecef]">
                    {account.phone_country_code && account.phone_number
                      ? `+${account.phone_country_code} ${account.phone_number}`
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-[#1e2329] rounded-sm border border-[#2b3139] overflow-hidden">
            <div className="px-4 py-3 bg-[#0b0e11] border-b border-[#2b3139]">
              <h3 className="text-sm font-medium text-[#eaecef] flex items-center">
                <Settings className="h-4 w-4 mr-2 text-[#FF6B00]" />
                Preferences
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Timezone */}
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-sm bg-[#FF6B00]/10 flex items-center justify-center mr-3 flex-shrink-0">
                  <Globe className="h-4 w-4 text-[#FF6B00]" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-[#848e9c]">Timezone</h4>
                  <p className="text-sm text-[#eaecef]">{account.timezone || '-'}</p>
                </div>
              </div>

              {/* Available Hours */}
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-sm bg-[#534AB7]/10 flex items-center justify-center mr-3 flex-shrink-0">
                  <Clock className="h-4 w-4 text-[#AFA9EC]" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-[#848e9c]">Available Hours</h4>
                  <p className="text-sm text-[#eaecef]">
                    {account.available_from && account.available_to
                      ? `${account.available_from} - ${account.available_to}`
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountPage;

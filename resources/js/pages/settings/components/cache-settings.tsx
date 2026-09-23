import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive, Trash2, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';

interface CacheSettingsProps {
  cacheSize?: string;
  auth?: any;
}

export default function CacheSettings({ cacheSize = '0.00', auth }: CacheSettingsProps) {
  const { t } = useTranslation();
  const [isClearing, setIsClearing] = useState(false);
  const canEdit = auth?.user?.permissions?.includes('clear-cache');
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Handle cache clear
  const handleClearCache = () => {
    setIsClearing(true);
    
    router.post(route('settings.cache.clear'), {}, {
      preserveScroll: true,
      onSuccess: () => {},
      onError: () => {},
      onFinish: () => {
        setIsClearing(false);
      }
    });
  };

  // Handle site optimization
  const handleOptimizeSite = () => {
    setIsOptimizing(true);
    
    router.post(route('settings.optimize'), {}, {
      preserveScroll: true,
      onSuccess: () => {},
      onError: () => {},
      onFinish: () => {
        setIsOptimizing(false);
      }
    });
  };

  return (
    <Card>
      <CardHeader className="p-2.5 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg">
          <HardDrive className="h-5 w-5 flex-shrink-0" />
          <span>{t('Cache Settings')}</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {t('Manage application cache to improve performance')}
        </p>
      </CardHeader>
      <CardContent className="p-2.5 sm:p-6 pt-0 sm:pt-0">
        <div className="space-y-6">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {t("This is a page meant for more advanced users, simply ignore it if you don't understand what cache is.")}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-4">
            <div className="flex items-center space-x-3">
              <HardDrive className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm sm:text-base">{t("Current Cache Size")}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {cacheSize} MB {t("of cached data")}
                </p>
              </div>
            </div>
            {canEdit && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleClearCache}
                  disabled={isClearing}
                  variant="destructive"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isClearing ? t("Clearing...") : t("Clear Cache")}
                </Button>
                 <Button
                  onClick={handleOptimizeSite}
                  disabled={isOptimizing}
                  variant="default"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isOptimizing ? t("Optimizing...") : t("Optimize Site")}
                </Button>
              </div>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>{t("Clearing cache will remove")}:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>{t("Application cache")}</li>
              <li>{t("Route cache")}</li>
              <li>{t("View cache")}</li>
              <li>{t("Configuration cache")}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}